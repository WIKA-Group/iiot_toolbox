type Encoder = (input: never) => unknown

type ChannelPayload = Record<string, unknown>

function encodes(encodeDownlink: Encoder, channel: string, payload: unknown): { ok: boolean, bytes: string } {
  try {
    const result = encodeDownlink({
      protocol: 'TULIP2',
      input: { deviceAction: 'configuration', [channel]: payload },
    } as never) as { errors?: string[], bytes?: number[] } | undefined
    if (result?.errors) return { ok: false, bytes: '' }
    return { ok: true, bytes: (result?.bytes ?? []).join(',') }
  }
  catch {
    return { ok: false, bytes: '' }
  }
}

type Wrap = (value: number) => ChannelPayload

const inAlarms = (name: string): Wrap => value => ({ alarms: { deadBand: 0, [name]: value } })

const delayedAlarm = (name: string): Wrap => value => ({
  alarms: { deadBand: 0, [name]: { value, delay: 0 } },
})

const onChannel = (name: string): Wrap => value => ({ alarms: { deadBand: 0 }, [name]: value })

const deadBandWrap: Wrap = value => ({ alarms: { deadBand: value } })

export interface ChannelField {
  name: string

  group: 'alarms' | 'channel'

  kind?: 'delayedThreshold'

  min?: number
  max?: number
}

const CANDIDATE_FIELDS: readonly { name: string, group: 'alarms' | 'channel', kind?: 'delayedThreshold', wrap: Wrap }[] = [
  { name: 'deadBand', group: 'alarms', wrap: deadBandWrap },
  { name: 'lowThreshold', group: 'alarms', wrap: inAlarms('lowThreshold') },
  { name: 'highThreshold', group: 'alarms', wrap: inAlarms('highThreshold') },
  { name: 'lowThresholdWithDelay', group: 'alarms', kind: 'delayedThreshold', wrap: delayedAlarm('lowThresholdWithDelay') },
  { name: 'highThresholdWithDelay', group: 'alarms', kind: 'delayedThreshold', wrap: delayedAlarm('highThresholdWithDelay') },
  { name: 'risingSlope', group: 'alarms', wrap: inAlarms('risingSlope') },
  { name: 'fallingSlope', group: 'alarms', wrap: inAlarms('fallingSlope') },
  { name: 'startUpTime', group: 'channel', wrap: onChannel('startUpTime') },
  { name: 'measureOffset', group: 'channel', wrap: onChannel('measureOffset') },
]

export function channelFieldGroup(name: string): ChannelField['group'] | undefined {
  return CANDIDATE_FIELDS.find(candidate => candidate.name === name)?.group
}

const SEEDS = [0, 1, 5, 10, 4, 12, 20, 0.5, -1, -10, -40, 50, 100, 500, 1000] as const

const OUTSIDE = 1e7

function isPresent(encodeDownlink: Encoder, channel: string, wrap: Wrap, samples: [number, number]): boolean {
  const first = encodes(encodeDownlink, channel, wrap(samples[0]))
  const second = encodes(encodeDownlink, channel, wrap(samples[1]))
  return first.ok && second.ok && first.bytes !== second.bytes
}

function distinctSamples(encodeDownlink: Encoder, channel: string, wrap: Wrap): [number, number] | undefined {
  const accepted: number[] = []
  for (const value of SEEDS) {
    if (!encodes(encodeDownlink, channel, wrap(value)).ok) continue
    accepted.push(value)
    if (accepted.length === 2) return [accepted[0]!, accepted[1]!]
  }

  return undefined
}

const ITERATIONS = 40

function roundOutward(value: number, direction: -1 | 1): number {
  const magnitude = Math.abs(value)
  if (magnitude === 0) return 0

  const step = 10 ** (Math.floor(Math.log10(magnitude)) - 3)
  const rounded = (direction === 1 ? Math.ceil(value / step) : Math.floor(value / step)) * step

  return Number(rounded.toPrecision(10))
}

function findEdge(
  encodeDownlink: Encoder,
  channel: string,
  wrap: Wrap,
  seed: number,
  direction: -1 | 1,
): number | undefined {
  const accepts = (value: number) => encodes(encodeDownlink, channel, wrap(value)).ok
  const outside = direction * OUTSIDE

  if (accepts(outside)) return undefined

  let inside = seed
  let beyond = outside
  for (let i = 0; i < ITERATIONS; i++) {
    const middle = (inside + beyond) / 2
    if (accepts(middle)) inside = middle
    else beyond = middle
  }
  return roundOutward(inside, direction)
}

export interface ChannelProbe {

  booleans: boolean[]

  booleanOnly: boolean
  fields: ChannelField[]
}

/** Probed edges are rounded outward, so this never rejects a value the parser would accept. */
export function limitViolation(
  field: Pick<ChannelField, 'min' | 'max'>,
  raw: string,
): 'below' | 'above' | undefined {
  if (raw.trim() === '') return undefined
  const value = Number(raw)
  if (!Number.isFinite(value)) return undefined
  if (field.min !== undefined && value < field.min) return 'below'
  if (field.max !== undefined && value > field.max) return 'above'
  return undefined
}

type Translate = (key: string, named?: Record<string, unknown>) => string

export function rangePlaceholder(field: Pick<ChannelField, 'min' | 'max'>): string | undefined {
  if (field.min !== undefined && field.max !== undefined) return `${field.min} – ${field.max}`
  if (field.min !== undefined) return `≥ ${field.min}`
  if (field.max !== undefined) return `≤ ${field.max}`
  return undefined
}

export function limitMessage(t: Translate, field: Pick<ChannelField, 'min' | 'max'>): string {
  if (field.min !== undefined && field.max !== undefined) {
    return t('encoder.tulip2.channel.limitBetween', { min: field.min, max: field.max })
  }
  if (field.min !== undefined) return t('encoder.tulip2.channel.limitMin', { min: field.min })
  return t('encoder.tulip2.channel.limitMax', { max: field.max })
}

export function probeChannel(encodeDownlink: Encoder | undefined, channel: string): ChannelProbe {
  if (!encodeDownlink) return { booleans: [], booleanOnly: false, fields: [] }

  const booleans = [true, false].filter(value => encodes(encodeDownlink, channel, value).ok)

  if (!encodes(encodeDownlink, channel, { alarms: { deadBand: 0 } }).ok) {
    return { booleans, booleanOnly: true, fields: [] }
  }

  const fields: ChannelField[] = []
  for (const candidate of CANDIDATE_FIELDS) {
    const samples = distinctSamples(encodeDownlink, channel, candidate.wrap)
    if (!samples) continue
    if (!isPresent(encodeDownlink, channel, candidate.wrap, samples)) continue

    fields.push({
      name: candidate.name,
      group: candidate.group,
      kind: candidate.kind,
      min: findEdge(encodeDownlink, channel, candidate.wrap, samples[0], -1),
      max: findEdge(encodeDownlink, channel, candidate.wrap, samples[0], 1),
    })
  }
  return { booleans, booleanOnly: false, fields }
}

export function resolveChannelKeys(encodeDownlink: Encoder | undefined): string[] {
  if (!encodeDownlink) return []
  const keys: string[] = []
  for (let index = 0; index < 8; index++) {
    const channel = `channel${index}`
    const accepted = encodes(encodeDownlink, channel, true).ok
      || encodes(encodeDownlink, channel, false).ok
      || encodes(encodeDownlink, channel, { alarms: { deadBand: 0 } }).ok
    if (accepted) keys.push(channel)
  }
  return keys
}

export function rangeOf(probe: ChannelProbe): { start: number, end: number } | undefined {
  const threshold = probe.fields.find(field => field.name === 'lowThreshold' || field.name === 'highThreshold')
  if (!threshold || threshold.min === undefined || threshold.max === undefined) return undefined
  return { start: threshold.min, end: threshold.max }
}
