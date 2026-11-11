export interface RegisterGroup {

  path: string

  names: readonly string[]
}

export const TULIP3_REGISTER_GROUPS = [
  {
    path: 'communicationModule.identification',
    names: ['productId', 'productSubId', 'channelPlan', 'connectedSensors', 'firmwareVersion', 'hardwareVersion', 'productionDate', 'serialNumberPart1', 'serialNumberPart2'],
  },
  {
    path: 'communicationModule.configuration',
    names: ['measuringPeriodAlarmOff', 'measuringPeriodAlarmOn', 'transmissionRateAlarmOff', 'transmissionRateAlarmOn', 'underVoltageThreshold', 'overVoltageThreshold', 'underTemperatureCmChip', 'overTemperatureCmChip', 'downlinkAnswerTimeout', 'fetchAdditionalDownlinkTimeInterval', 'enableBleAdvertising'],
  },
  {
    path: '{sensor}.identification',
    names: ['sensorType', 'existingChannels', 'firmwareVersion', 'hardwareVersion', 'productionDate', 'serialNumberPart1', 'serialNumberPart2'],
  },
  {
    path: '{sensor}.configuration',
    names: ['bootTime', 'samplingChannels', 'communicationTimeout', 'communicationRetryCount'],
  },
  {
    path: '{sensor}.{channel}.identification',
    names: ['measurand', 'unit', 'accuracy', 'gain', 'offset', 'calibrationDate', 'minMeasureRange', 'maxMeasureRange', 'minPhysicalLimit', 'maxPhysicalLimit'],
  },
  {
    path: '{sensor}.{channel}.configuration',
    names: ['processAlarmEnabled', 'processAlarmDeadBand', 'lowThresholdAlarmValue', 'highThresholdAlarmValue', 'lowThresholdWithDelayAlarmValue', 'lowThresholdWithDelayAlarmDelay', 'highThresholdWithDelayAlarmValue', 'highThresholdWithDelayAlarmDelay', 'risingSlopeAlarmValue', 'fallingSlopeAlarmValue', 'protocolDataType'],
  },
] as const satisfies readonly RegisterGroup[]

export type RegisterName = typeof TULIP3_REGISTER_GROUPS[number]['names'][number]

const SENSOR_CANDIDATES = ['sensor1', 'sensor2', 'sensor3', 'sensor4'] as const
const CHANNEL_CANDIDATES = ['channel1', 'channel2', 'channel3', 'channel4', 'channel5', 'channel6', 'channel7', 'channel8'] as const

const NOTHING_SELECTED = 'No registers selected'

const PROBE_HIGH = 1e9
const PROBE_LOW = -1e9
const PROBE_FRACTION = 3.7

type Encoder = (input: never) => unknown

interface Outcome {
  ok: boolean

  message: string
}

function nestValue(path: string, name: string, value: unknown): Record<string, unknown> {
  let node: Record<string, unknown> = { [name]: value }
  for (const segment of path.split('.').reverse()) node = { [segment]: node }
  return node
}

export function registerInput(path: string, name: string): Record<string, unknown> {
  return nestValue(path, name, true)
}

function attempt(
  encodeDownlink: Encoder,
  action: 'readRegisters' | 'writeRegisters',
  input: Record<string, unknown>,
): Outcome {
  try {
    const result = encodeDownlink({ protocol: 'TULIP3', input: { action, input } } as never) as
      { errors?: string[] } | undefined
    if (!result?.errors) return { ok: true, message: '' }
    return { ok: false, message: result.errors.join(' ').replace(/\s+/g, ' ') }
  }
  catch (error) {
    return { ok: false, message: String(error) }
  }
}

const isDropped = (outcome: Outcome) => !outcome.ok && outcome.message.includes(NOTHING_SELECTED)

function accepts(encodeDownlink: Encoder, path: string, name: string): boolean {
  return attempt(encodeDownlink, 'readRegisters', registerInput(path, name)).ok
}

export interface ResolvedGroup {
  path: string
  names: string[]
}

export function resolveRegisters(encodeDownlink: Encoder): ResolvedGroup[] {
  const sensors = SENSOR_CANDIDATES.filter(s => accepts(encodeDownlink, `${s}.identification`, 'sensorType'))
  const resolved: ResolvedGroup[] = []

  for (const group of TULIP3_REGISTER_GROUPS) {
    if (!group.path.includes('{sensor}')) {
      const names = group.names.filter(n => accepts(encodeDownlink, group.path, n))
      if (names.length) resolved.push({ path: group.path, names })
      continue
    }

    for (const sensor of sensors) {
      if (!group.path.includes('{channel}')) {
        const path = group.path.replace('{sensor}', sensor)
        const names = group.names.filter(n => accepts(encodeDownlink, path, n))
        if (names.length) resolved.push({ path, names })
        continue
      }

      const channels = CHANNEL_CANDIDATES.filter(c =>
        accepts(encodeDownlink, group.path.replace('{sensor}', sensor).replace('{channel}', c), group.names[0]),
      )
      for (const channel of channels) {
        const path = group.path.replace('{sensor}', sensor).replace('{channel}', channel)
        const names = group.names.filter(n => accepts(encodeDownlink, path, n))
        if (names.length) resolved.push({ path, names })
      }
    }
  }

  return resolved
}

export type RegisterFacts =
  | { access: 'readOnly' }
  | { access: 'readWrite', control: 'number' | 'integer', min?: number, max?: number }
  | { access: 'readWrite', control: 'boolean' }
  | { access: 'readWrite', control: 'select', options: readonly string[] }

  | { access: 'readWrite', control: 'flags' }

  | { access: 'readWrite', control: 'channelSet', keys: readonly string[] }

  | { access: 'readWrite', control: 'unenumerable', reason: string }

function limitFrom(message: string): { min?: number, max?: number } {
  const single = message.match(/Value must be (<=|>=) (-?[\d.]+)/)
    ?? message.match(/Invalid value: Expected (<=|>=) ?(-?[\d.]+)/)
  if (single) return single[1] === '<=' ? { max: Number(single[2]) } : { min: Number(single[2]) }

  const range = message.match(/integer between (-?\d+) and (-?\d+)/)
  if (range) return { min: Number(range[1]), max: Number(range[2]) }

  return {}
}

function optionsFrom(message: string): string[] | undefined {
  const multi = message.match(/Invalid type: Expected \(([^)]*)\)/)?.[1]
  if (multi !== undefined) return multi.split('|').map(part => part.trim().replace(/^"|"$/g, ''))

  const single = message.match(/Invalid type: Expected ("[^"]*") but received/)?.[1]
  if (single !== undefined) return [single.replace(/^"|"$/g, '')]

  return undefined
}

function typeFrom(message: string): string | undefined {
  return message.match(/Invalid type: Expected (\w+) but received/)?.[1]
}

type ObjectKeys =

  | { kind: 'strict', keys: string[] }
  | { kind: 'loose' }
  | { kind: 'unreadable', message: string }

function strictKeys(encodeDownlink: Encoder, path: string, name: string): ObjectKeys {
  const keys: string[] = []
  for (let i = 0; i <= CHANNEL_CANDIDATES.length; i++) {
    const value: Record<string, boolean> = {}
    for (const key of keys) value[key] = true

    const outcome = attempt(encodeDownlink, 'writeRegisters', nestValue(path, name, value))

    if (outcome.ok) return keys.length ? { kind: 'strict', keys } : { kind: 'loose' }

    const missing = outcome.message.match(/Invalid key: Expected "([^"]+)"/)?.[1]
    if (missing === undefined) return { kind: 'unreadable', message: outcome.message }
    keys.push(missing)
  }

  return { kind: 'unreadable', message: `more than ${CHANNEL_CANDIDATES.length} required keys` }
}

function describeRegister(encodeDownlink: Encoder, path: string, name: string): RegisterFacts {
  const high = attempt(encodeDownlink, 'writeRegisters', nestValue(path, name, PROBE_HIGH))
  if (isDropped(high)) return { access: 'readOnly' }

  const typeName = typeFrom(high.message)
  if (typeName === 'boolean') return { access: 'readWrite', control: 'boolean' }
  if (typeName === 'Object') {
    const object = strictKeys(encodeDownlink, path, name)
    if (object.kind === 'strict') return { access: 'readWrite', control: 'channelSet', keys: object.keys }
    if (object.kind === 'loose') return { access: 'readWrite', control: 'flags' }

    return { access: 'readWrite', control: 'unenumerable', reason: object.message }
  }

  const options = optionsFrom(high.message)
  if (options) return { access: 'readWrite', control: 'select', options }

  const low = attempt(encodeDownlink, 'writeRegisters', nestValue(path, name, PROBE_LOW))
  const fraction = attempt(encodeDownlink, 'writeRegisters', nestValue(path, name, PROBE_FRACTION))
  const integer = /Invalid integer/.test(fraction.message)
    || /integer between/.test(high.message)
    || /integer between/.test(low.message)

  return {
    access: 'readWrite',
    control: integer ? 'integer' : 'number',
    ...limitFrom(low.message),
    ...limitFrom(high.message),
  }
}

export interface RegisterInfo {

  key: string
  name: string
  facts: RegisterFacts
}

export interface GroupProfile {

  path: string
  owner: 'communicationModule' | 'sensor' | 'channel'
  section: 'identification' | 'configuration'
  registers: RegisterInfo[]
}

export interface ChannelProfile {

  path: string

  units?: readonly string[]

  measurands?: readonly string[]

  quantity?: QuantityKind

  min?: number
  max?: number
}

export interface DeviceProfile {
  groups: GroupProfile[]
  channels: ChannelProfile[]
}

const CHANNEL_PATH = /^sensor\d+\.channel\d+\./

function ownerOf(path: string): GroupProfile['owner'] {
  if (path.startsWith('communicationModule')) return 'communicationModule'
  return CHANNEL_PATH.test(path) ? 'channel' : 'sensor'
}

export function profileDevice(encodeDownlink: Encoder): DeviceProfile {
  const groups: GroupProfile[] = resolveRegisters(encodeDownlink).map(group => ({
    path: group.path,
    owner: ownerOf(group.path),
    section: group.path.endsWith('.identification') ? 'identification' : 'configuration',
    registers: group.names.map(name => ({
      key: `${group.path}.${name}`,
      name,
      facts: describeRegister(encodeDownlink, group.path, name),
    })),
  }))

  const channels: ChannelProfile[] = groups
    .filter(group => group.owner === 'channel' && group.section === 'identification')
    .map((group) => {
      const path = group.path.replace(/\.identification$/, '')

      const unit = group.registers.find(register => register.name === 'unit')?.facts
      const units = unit?.access === 'readWrite' && unit.control === 'select' ? unit.options : undefined

      const measurand = group.registers.find(register => register.name === 'measurand')?.facts
      const measurands = measurand?.access === 'readWrite' && measurand.control === 'select' ? measurand.options : undefined

      const configuration = groups.find(other => other.path === `${path}.configuration`)
      const threshold = configuration?.registers
        .find(register => register.name === 'lowThresholdAlarmValue' || register.name === 'highThresholdAlarmValue')
        ?.facts
      const range = threshold?.access === 'readWrite' && (threshold.control === 'number' || threshold.control === 'integer')
        ? { min: threshold.min, max: threshold.max }
        : {}

      return { path, units, measurands, quantity: units && quantityOf(units), ...range }
    })

  return { groups, channels }
}

export interface ChannelRange {
  start: number
  end: number
}

function probeChannelBounds(encodeDownlink: Encoder): Map<string, ChannelRange> {
  const bounds = new Map<string, ChannelRange>()
  const sensors = SENSOR_CANDIDATES.filter(s => accepts(encodeDownlink, `${s}.identification`, 'sensorType'))

  for (const sensor of sensors) {
    for (const channel of CHANNEL_CANDIDATES) {
      const path = `${sensor}.${channel}`
      if (!accepts(encodeDownlink, `${path}.identification`, 'measurand')) continue

      for (const name of ['lowThresholdAlarmValue', 'highThresholdAlarmValue']) {
        const high = attempt(encodeDownlink, 'writeRegisters', nestValue(`${path}.configuration`, name, PROBE_HIGH))
        if (isDropped(high)) continue
        const low = attempt(encodeDownlink, 'writeRegisters', nestValue(`${path}.configuration`, name, PROBE_LOW))

        const limits = { ...limitFrom(low.message), ...limitFrom(high.message) }
        if (limits.min !== undefined && limits.max !== undefined) {
          bounds.set(path, { start: limits.min, end: limits.max })
          break
        }
      }
    }
  }
  return bounds
}

const RANGE_SENTINEL: ChannelRange = { start: -987.5, end: 987.25 }

interface RangeProbeParser {
  encodeDownlink?: (input: never) => unknown
  adjustMeasuringRange: (channel: never, range: ChannelRange) => void
}

export function resolveChannelRanges(
  makeParser: () => RangeProbeParser,
  channels: readonly string[],
): Map<string, ChannelRange> {
  const ranges = new Map<string, ChannelRange>()
  if (channels.length === 0) return ranges

  const pristine = makeParser()
  if (!pristine.encodeDownlink) return ranges
  const base = probeChannelBounds(pristine.encodeDownlink)
  if (base.size === 0) return ranges

  for (const channel of channels) {
    const probe = makeParser()
    if (!probe.encodeDownlink) continue
    try {
      probe.adjustMeasuringRange(channel as never, RANGE_SENTINEL)
    }
    catch {
      continue
    }

    for (const [path, moved] of probeChannelBounds(probe.encodeDownlink)) {
      if (moved.start !== RANGE_SENTINEL.start || moved.end !== RANGE_SENTINEL.end) continue
      const original = base.get(path)
      if (original) ranges.set(channel, original)
      break
    }
  }

  return ranges
}

export function buildRegisterSelection(selected: readonly string[]): Record<string, unknown> {
  const root: Record<string, unknown> = {}
  for (const entry of selected) {
    const segments = entry.split('.')
    const name = segments.pop()
    if (!name) continue
    let node = root
    for (const segment of segments) {
      node[segment] ??= {}
      node = node[segment] as Record<string, unknown>
    }
    node[name] = true
  }
  return root
}

export type QuantityKind = 'pressure' | 'temperature' | 'current' | 'voltage' | 'mass' | 'force' | 'relative'

export const UNIT_QUANTITY: Readonly<Record<string, QuantityKind>> = {
  'bar': 'pressure',
  'mbar': 'pressure',
  'μbar': 'pressure',
  'Pa': 'pressure',
  'hPa': 'pressure',
  'kPa': 'pressure',
  'MPa': 'pressure',
  'psi': 'pressure',
  '°C': 'temperature',
  '°F': 'temperature',
  'K': 'temperature',
  '°R': 'temperature',
  'mA': 'current',
  'μA': 'current',
  'V': 'voltage',
  'mV': 'voltage',
  'μV': 'voltage',
  'kg': 'mass',
  'g': 'mass',
  'N': 'force',
  'kN': 'force',
  '%': 'relative',
}

// Only a channel whose units all measure the same quantity is named by it; mixed units stay generic.
function quantityOf(units: readonly string[]): QuantityKind | undefined {
  const kinds = new Set(units.map(unit => UNIT_QUANTITY[unit]).filter(Boolean))
  return kinds.size === 1 ? [...kinds][0] : undefined
}

export const PROCESS_ALARM_FLAGS = [
  'lowThreshold',
  'highThreshold',
  'fallingSlope',
  'risingSlope',
  'lowThresholdWithDelay',
  'highThresholdWithDelay',
] as const

export interface RegisterCopy {

  labelKey: string

  unit?: string

  advisoryMin?: number
  advisoryMax?: number
}

export const REGISTER_COPY: Partial<Record<RegisterName, RegisterCopy>> = {

  productId: { labelKey: 'productId' },
  productSubId: { labelKey: 'productSubId' },
  channelPlan: { labelKey: 'channelPlan' },
  connectedSensors: { labelKey: 'connectedSensors' },
  firmwareVersion: { labelKey: 'firmwareVersion' },
  hardwareVersion: { labelKey: 'hardwareVersion' },
  productionDate: { labelKey: 'productionDate' },
  serialNumberPart1: { labelKey: 'serialNumberPart1' },
  serialNumberPart2: { labelKey: 'serialNumberPart2' },

  measuringPeriodAlarmOff: { labelKey: 'measuringPeriodAlarmOff', unit: 's', advisoryMax: 604800 },
  measuringPeriodAlarmOn: { labelKey: 'measuringPeriodAlarmOn', unit: 's', advisoryMax: 604800 },

  transmissionRateAlarmOff: { labelKey: 'transmissionRateAlarmOff' },
  transmissionRateAlarmOn: { labelKey: 'transmissionRateAlarmOn' },
  underVoltageThreshold: { labelKey: 'underVoltageThreshold' },
  overVoltageThreshold: { labelKey: 'overVoltageThreshold' },

  underTemperatureCmChip: { labelKey: 'underTemperatureCmChip', unit: '°C' },
  overTemperatureCmChip: { labelKey: 'overTemperatureCmChip', unit: '°C' },
  downlinkAnswerTimeout: { labelKey: 'downlinkAnswerTimeout' },
  fetchAdditionalDownlinkTimeInterval: { labelKey: 'fetchAdditionalDownlinkTimeInterval' },
  enableBleAdvertising: { labelKey: 'enableBleAdvertising' },

  sensorType: { labelKey: 'sensorType' },
  existingChannels: { labelKey: 'existingChannels' },
  bootTime: { labelKey: 'bootTime' },
  samplingChannels: { labelKey: 'samplingChannels' },
  communicationTimeout: { labelKey: 'communicationTimeout' },
  communicationRetryCount: { labelKey: 'communicationRetryCount' },

  measurand: { labelKey: 'measurand' },
  unit: { labelKey: 'unit' },
  accuracy: { labelKey: 'accuracy' },
  gain: { labelKey: 'gain' },
  offset: { labelKey: 'offset' },
  calibrationDate: { labelKey: 'calibrationDate' },
  minMeasureRange: { labelKey: 'minMeasureRange' },
  maxMeasureRange: { labelKey: 'maxMeasureRange' },
  minPhysicalLimit: { labelKey: 'minPhysicalLimit' },
  maxPhysicalLimit: { labelKey: 'maxPhysicalLimit' },

  processAlarmEnabled: { labelKey: 'processAlarmEnabled' },
  processAlarmDeadBand: { labelKey: 'processAlarmDeadBand' },
  lowThresholdAlarmValue: { labelKey: 'lowThresholdAlarmValue' },
  highThresholdAlarmValue: { labelKey: 'highThresholdAlarmValue' },
  lowThresholdWithDelayAlarmValue: { labelKey: 'lowThresholdWithDelayAlarmValue' },
  lowThresholdWithDelayAlarmDelay: { labelKey: 'lowThresholdWithDelayAlarmDelay' },
  highThresholdWithDelayAlarmValue: { labelKey: 'highThresholdWithDelayAlarmValue' },
  highThresholdWithDelayAlarmDelay: { labelKey: 'highThresholdWithDelayAlarmDelay' },
  risingSlopeAlarmValue: { labelKey: 'risingSlopeAlarmValue' },
  fallingSlopeAlarmValue: { labelKey: 'fallingSlopeAlarmValue' },
  protocolDataType: { labelKey: 'protocolDataType' },
}

export function advisoryWarning(name: string, value: number): 'low' | 'high' | undefined {
  const copy = REGISTER_COPY[name as RegisterName]
  if (!copy) return undefined
  if (copy.advisoryMin !== undefined && value < copy.advisoryMin) return 'low'
  if (copy.advisoryMax !== undefined && value > copy.advisoryMax) return 'high'
  return undefined
}

export interface ChannelUnit {

  unit: string

  source: string
}

export const CHANNEL_UNITS: Readonly<Record<string, Readonly<Record<string, ChannelUnit>>>> = {
  'netris2': {

    'Electrical current1': { unit: 'mA', source: 'AC 40.02 p.2, "Basisinformationen → Sensor 4 ... 20 mA"' },
    'Electrical current2': { unit: 'mA', source: 'AC 40.02 p.2, "Basisinformationen → Sensor 4 ... 20 mA"' },
  },
  'netris-f': {

    'device temperature': { unit: '°C', source: 'AC 40.10 p.4, "Genauigkeitsangaben des Temperaturwerts → Messbereich -20 ... +80 °C [-4 ... +176 °F]"' },
  },
  'pew': {

    'device temperature': { unit: '°C', source: 'PE 87.23 p.2, "Genauigkeitsangaben des Temperaturwerts → Messbereich -20 ... +80 °C [-4 ... +176 °F]"' },
  },
}

export function channelUnit(slug: string, channelName: string): string | undefined {
  return CHANNEL_UNITS[slug]?.[channelName]?.unit
}
