type Encoder = (input: never) => unknown

interface Outcome {
  ok: boolean
  message: string

  bytes: string
}

function attempt(encodeDownlink: Encoder, input: Record<string, unknown>): Outcome {
  try {
    const result = encodeDownlink({ protocol: 'TULIP2', input } as never) as
      { errors?: string[], bytes?: number[] } | undefined
    if (!result?.errors) return { ok: true, message: '', bytes: (result?.bytes ?? []).join(',') }
    return { ok: false, message: result.errors.join(' ').replace(/\s+/g, ' '), bytes: '' }
  }
  catch (error) {
    return { ok: false, message: String(error), bytes: '' }
  }
}

const CONFIG_ID_SENTINEL = 7

export interface MainConfigurationField {
  name: string

  type: MainConfigurationFieldType

  min?: number
  max?: number
}

export type MainConfigurationFieldType = 'number' | 'boolean' | 'unknown'

function limitFrom(message: string): { min?: number, max?: number } {
  const single = message.match(/Value must be (<=|>=) (-?[\d.]+)/)
    ?? message.match(/Invalid value: Expected (<=|>=) ?(-?[\d.]+)/)
  if (single) return single[1] === '<=' ? { max: Number(single[2]) } : { min: Number(single[2]) }
  const range = message.match(/between (-?\d+) and (-?\d+)/)
  if (range) return { min: Number(range[1]), max: Number(range[2]) }
  return {}
}

function scoped(message: string, name: string): string {
  return message.split('×').find(entry => entry.includes(name)) ?? ''
}

const TYPE_SENTINEL = '__probe__'

function placeholder(type: MainConfigurationFieldType): unknown {
  return type === 'boolean' ? false : 1
}

function typeOf(
  encodeDownlink: Encoder,
  others: Record<string, unknown>,
  name: string,
): MainConfigurationFieldType {
  const message = attempt(encodeDownlink, {
    deviceAction: 'configuration',
    mainConfiguration: { ...others, [name]: TYPE_SENTINEL },
  }).message
  const expected = scoped(message, name).match(/Invalid type: Expected (\w+)/)?.[1]
  if (expected === 'boolean') return 'boolean'
  if (expected === 'number') return 'number'
  return 'unknown'
}

export function resolveMainConfiguration(encodeDownlink: Encoder | undefined): MainConfigurationField[] {
  if (!encodeDownlink) return []

  const fields: MainConfigurationField[] = []
  const fill = (entries: MainConfigurationField[]) =>
    Object.fromEntries(entries.map(field => [field.name, placeholder(field.type)]))

  for (let i = 0; i < 16; i++) {
    const payload = fill(fields)
    const outcome = attempt(encodeDownlink, { deviceAction: 'configuration', mainConfiguration: payload })

    const missing = outcome.message.match(/Invalid key: Expected "([^"]+)"/)?.[1]
    if (!missing) break

    fields.push({ name: missing, type: typeOf(encodeDownlink, payload, missing) })
  }

  return fields.map((field) => {
    if (field.type !== 'number') return field
    const others = fill(fields.filter(other => other.name !== field.name))
    const probe = (value: number) =>
      scoped(attempt(encodeDownlink, {
        deviceAction: 'configuration',
        mainConfiguration: { ...others, [field.name]: value },
      }).message, field.name)
    return {
      ...field,
      ...limitFrom(probe(-1e9)),
      ...limitFrom(probe(1e9)),
    }
  })
}

export type ProbeAnswer = 'yes' | 'no' | 'untested'

export function writesConfigurationId(
  encodeDownlink: Encoder | undefined,
  input: Record<string, unknown>,
): ProbeAnswer {
  if (!encodeDownlink) return 'untested'

  const bare = attempt(encodeDownlink, input)
  if (!bare.ok) return 'untested'
  const withId = attempt(encodeDownlink, { ...input, configurationId: CONFIG_ID_SENTINEL })

  if (!withId.ok) return 'untested'
  return withId.bytes !== bare.bytes ? 'yes' : 'no'
}

export function maxConfigurationId(
  encodeDownlink: Encoder | undefined,
  input: Record<string, unknown>,
): number | undefined {
  if (!encodeDownlink) return undefined

  const message = attempt(encodeDownlink, {
    ...input,
    configurationId: Number.MAX_SAFE_INTEGER,
  }).message
  const match = message.match(/configurationId needs to be at most (\d+)/)
  return match ? Number(match[1]) : undefined
}

const GET_CONFIGURATION_PATHS = [
  'mainConfiguration',
  'processAlarmConfiguration',
  'channelConfiguration',
  'channelPropertyConfiguration',
  ...Array.from({ length: 8 }, (_, index) => `channel${index}`),
  ...Array.from({ length: 8 }, (_, index) => `channel${index}.alarms`),
  ...Array.from({ length: 8 }, (_, index) => `channel${index}.measureOffset`),
] as const

export function buildGetConfigurationInput(paths: readonly string[]): Record<string, unknown> {
  const input: Record<string, unknown> = { deviceAction: 'getConfiguration' }
  const sorted = [...paths].sort((left, right) => left.length - right.length)

  for (const path of sorted) {
    const segments = path.split('.')
    if (segments.some((_, index) => sorted.some(other =>
      other !== path && other.split('.').length <= index && path.startsWith(`${other}.`),
    ))) continue

    let node = input
    for (const segment of segments.slice(0, -1)) {
      node[segment] ??= {}
      node = node[segment] as Record<string, unknown>
    }
    node[segments.at(-1)!] = true
  }
  return input
}

export function resolveGetConfigurationBlocks(encodeDownlink: Encoder | undefined): string[] {
  if (!encodeDownlink) return []
  return GET_CONFIGURATION_PATHS.filter(path =>
    attempt(encodeDownlink, buildGetConfigurationInput([path])).ok,
  )
}

export interface Tulip2Vocabulary {

  all: readonly string[]

  parameterless: readonly string[]

  usesConfigurationId: readonly string[]

  configurationIdUntested: readonly string[]

  needsForm: readonly string[]
}

const EMPTY: Tulip2Vocabulary = {
  all: [],
  parameterless: [],
  usesConfigurationId: [],
  configurationIdUntested: [],
  needsForm: [],
}

export function resolveTulip2Actions(encodeDownlink: Encoder | undefined): Tulip2Vocabulary {
  if (!encodeDownlink) return EMPTY

  const vocabulary = attempt(encodeDownlink, {})
  const listed = vocabulary.message.match(/Expected \(([^)]*)\)/)?.[1]
  if (!listed) return EMPTY

  const all = listed.split('|').map(entry => entry.trim().replace(/^"|"$/g, '')).filter(Boolean)
  const parameterless: string[] = []
  const usesConfigurationId: string[] = []
  const configurationIdUntested: string[] = []
  const needsForm: string[] = []

  for (const deviceAction of all) {
    const bare = attempt(encodeDownlink, { deviceAction })
    if (!bare.ok) {
      needsForm.push(deviceAction)

      configurationIdUntested.push(deviceAction)
      continue
    }
    parameterless.push(deviceAction)

    const withId = attempt(encodeDownlink, { deviceAction, configurationId: CONFIG_ID_SENTINEL })
    if (!withId.ok) configurationIdUntested.push(deviceAction)
    else if (withId.bytes !== bare.bytes) usesConfigurationId.push(deviceAction)
  }

  return { all, parameterless, usesConfigurationId, configurationIdUntested, needsForm }
}
