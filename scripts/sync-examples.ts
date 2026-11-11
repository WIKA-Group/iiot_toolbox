import { Buffer } from 'node:buffer'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const REF = '4.10.0'

const REPO = 'WIKA-Group/javascript_parsers'

const DEVICE_DIRS: Record<string, string> = {
  'a2g': 'A2G',
  'flru': 'FLRU_NETRIS3',
  'gd20w': 'GD20W',
  'netris1': 'NETRIS1',
  'netris2': 'NETRIS2',
  'netris-f': 'NETRISF',
  'peu': 'PEU_NETRIS3',
  'pew': 'PEW',
  'pgu': 'PGU_NETRIS3',
  'pgw23': 'PGW23_100_11',
  'tgu': 'TGU_NETRIS3',
  'tru': 'TRU_NETRIS3',
  'trw': 'TRW',
}

interface UpstreamExample {
  type?: string
  description?: string
  input?: { bytes?: number[] | string }

  output?: { data?: unknown, errors?: unknown }
}

interface ExtractedExample {
  description: string
  hex: string
}

const PER_PROTOCOL_CAP = 8

// TULIP3 message types start at 0x10; TULIP2 ones end at 0x0C.
const isTulip3 = (hex: string) => Number.parseInt(hex.slice(0, 2), 16) >= 0x10

// TULIP3 distinguishes messages by type and subtype (e.g. 0x13 01/02/03).
const messageKey = (hex: string) => hex.slice(0, isTulip3(hex) ? 4 : 2)

function spreadByMessageType(examples: ExtractedExample[], cap: number): ExtractedExample[] {
  const byType = new Map<string, ExtractedExample[]>()
  for (const example of examples) {
    const type = messageKey(example.hex)
    const bucket = byType.get(type)
    if (bucket) bucket.push(example)
    else byType.set(type, [example])
  }

  const picked: ExtractedExample[] = []
  for (let round = 0; picked.length < cap; round++) {
    let addedThisRound = false
    for (const bucket of byType.values()) {
      const next = bucket[round]
      if (!next) continue
      picked.push(next)
      addedThisRound = true
      if (picked.length === cap) break
    }

    if (!addedThisRound) break
  }
  return picked
}

function toHex(bytes: number[] | string): string | undefined {
  if (Array.isArray(bytes)) {
    if (!bytes.every(b => Number.isInteger(b) && b >= 0 && b <= 255)) return undefined
    return Buffer.from(bytes).toString('hex').toUpperCase()
  }
  const cleaned = bytes.replace(/0x/gi, '').replace(/[\s,]/g, '').toUpperCase()
  if (!/^[0-9A-F]+$/.test(cleaned) || cleaned.length % 2 !== 0) return undefined
  return cleaned
}

function tidy(description: string): string {
  return description
    .replace(/^(good|bad|error)\s*case\s*:?\s*/i, '')
    .replace(/\s*\b(hex\s*)?uplink example (with|for)\b\s*/i, ' ')
    // Upstream uses unit-test names ("should parse partial registers").
    .replace(/\bshould\s+(?:be able to\s+)?(?:decode|parse|handle)\s+(?:an?\s+|the\s+)?/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchExamples(dir: string): Promise<UpstreamExample[]> {
  const url = `https://raw.githubusercontent.com/${REPO}/${REF}/packages/parsers/src/devices/${dir}/examples.json`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${dir}: ${response.status} ${response.statusText} for ${url}`)
  return await response.json() as UpstreamExample[]
}

const result: Record<string, ExtractedExample[]> = {}
const report: string[] = []

for (const [slug, dir] of Object.entries(DEVICE_DIRS)) {
  const all = await fetchExamples(dir)
  const seen = new Set<string>()
  const extracted: ExtractedExample[] = []

  for (const example of all) {
    // NETRIS1 and TRW label their TULIP2 uplinks "uplink - voltage" / "uplink - temperature".
    if (!/^(uplink|hexUplink)\b/.test(example.type ?? '')) continue

    if (example.output?.errors !== undefined || example.output?.data === undefined) continue
    const bytes = example.input?.bytes
    if (bytes === undefined) continue
    const hex = toHex(bytes)
    if (!hex) continue

    if (seen.has(hex)) continue
    seen.add(hex)
    extracted.push({
      description: tidy(example.description ?? '') || 'Uplink',
      hex,
    })
  }

  const tulip2 = spreadByMessageType(extracted.filter(e => !isTulip3(e.hex)), PER_PROTOCOL_CAP)
  const tulip3 = spreadByMessageType(extracted.filter(e => isTulip3(e.hex)), PER_PROTOCOL_CAP)
  const label = (protocol: string, e: ExtractedExample) => ({
    ...e,
    description: `${protocol}: ${e.description.replace(/^TULIP[23]\s+/i, '')}`,
  })
  const picked = [...tulip2.map(e => label('TULIP2', e)), ...tulip3.map(e => label('TULIP3', e))]
  result[slug] = picked
  report.push(
    `${slug.padEnd(9)} kept TULIP2 ${String(tulip2.length).padStart(2)}, TULIP3 ${String(tulip3.length).padStart(2)}`
    + ` of ${String(extracted.length).padStart(3)} uplinks (${String(all.length).padStart(3)} entries)`,
  )
}

const header = `export interface ExampleUplink {
  description: string
  hex: string
}

export const EXAMPLE_UPLINKS: Readonly<Record<string, readonly ExampleUplink[]>> = `

function serialise(devices: Record<string, ExtractedExample[]>): string {
  const quote = (value: string) => `'${value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'')}'`
  const lines = ['{']
  for (const [slug, examples] of Object.entries(devices)) {
    lines.push(`  ${quote(slug)}: [`)
    for (const example of examples) {
      lines.push('    {')
      lines.push(`      description: ${quote(example.description)},`)
      lines.push(`      hex: ${quote(example.hex)},`)
      lines.push('    },')
    }
    lines.push('  ],')
  }
  lines.push('} as const')
  return lines.join('\n')
}

const body = `${serialise(result)}\n`

const target = path.resolve(__dirname, '../app/utils/exampleUplinks.generated.ts')
writeFileSync(target, `${header}${body}`, 'utf8')

process.stdout.write(`${report.join('\n')}\n\nwrote ${path.relative(process.cwd(), target)}\n`)
