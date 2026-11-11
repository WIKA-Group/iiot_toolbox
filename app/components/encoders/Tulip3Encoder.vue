<script setup lang="ts">
import type { DownlinkResult } from '~/composables/useDownlinkResult'
import type { GroupProfile, RegisterInfo } from '~/utils/tulip3Registers'

import { encodeFrames } from '~/utils/encodeFrames'
import { limitMessage, limitViolation } from '~/utils/tulip2Channels'
import { communicationLimits, withCommunicationLimits } from '~/utils/tulip3Limits'
import {
  advisoryWarning,
  buildRegisterSelection,
  profileDevice,
  REGISTER_COPY,
} from '~/utils/tulip3Registers'
import { parseSet, setMembers, undecidedMembers } from '~/utils/tulip3Sets'

const props = defineProps<{
  encodeDownlink: (input: never) => unknown
  encodeMultipleDownlinks?: (input: never) => unknown
  slug?: string
  channelLabels?: Readonly<Record<string, string>>
}>()

const { t } = useI18n()

const ACTIONS = [
  'readRegisters',
  'writeRegisters',
  'forceCloseSession',
  'restoreDefaultConfiguration',
  'newBatteryInserted',
  'getAlarmStatus',
] as const

type ActionValue = typeof ACTIONS[number]

const DIRECT_ACTIONS: readonly ActionValue[] = [
  'forceCloseSession',
  'restoreDefaultConfiguration',
  'newBatteryInserted',
]

const ACTIONS_WITH_INPUTS: readonly ActionValue[] = [
  'getAlarmStatus',
  'readRegisters',
  'writeRegisters',
]

const action = useRouteQuery<string>('t3Action', 'forceCloseSession')
const processAlarm = useRouteQuery<string>('t3ProcessAlarm', 'false')
const cmAlarm = useRouteQuery<string>('t3CmAlarm', 'false')
const sensorAlarm = useRouteQuery<string>('t3SensorAlarm', 'false')
const channelAlarm = useRouteQuery<string>('t3ChannelAlarm', 'false')

const selected = computed<ActionValue>(() =>
  ACTIONS.some(value => value === action.value) ? action.value as ActionValue : 'forceCloseSession',
)

const needsAlarmFlags = computed(() => selected.value === 'getAlarmStatus')
const isReading = computed(() => selected.value === 'readRegisters')
const isWriting = computed(() => selected.value === 'writeRegisters')

// Read and write may span several frames; the other actions always fit one frame.
const usesByteLimit = computed(() => isReading.value || isWriting.value)
const byteLimit = useRouteQuery<string>('t3ByteLimit', '')
const MIN_BYTE_LIMIT = 11

const byteLimitError = computed(() => {
  if (byteLimit.value === '') return undefined
  const value = Number(byteLimit.value)
  return Number.isInteger(value) && value >= MIN_BYTE_LIMIT
    ? undefined
    : t('encoder.tulip3.byteLimitInvalid', { min: MIN_BYTE_LIMIT })
})

const profile = computed(() => withCommunicationLimits(profileDevice(props.encodeDownlink), props.slug))

const registerByKey = computed(() => {
  const map = new Map<string, RegisterInfo>()
  for (const group of profile.value.groups) {
    for (const register of group.registers) map.set(register.key, register)
  }
  return map
})

interface Section {

  key: string
  title: string

  groups: GroupProfile[]
}

const SUBSECTION_ORDER = ['identification', 'configuration'] as const

const sections = computed<Section[]>(() => {
  const byOwner = new Map<string, GroupProfile[]>()
  for (const group of profile.value.groups) {
    const key = group.path.replace(/\.(?:identification|configuration)$/, '')
    const list = byOwner.get(key)
    if (list) list.push(group)
    else byOwner.set(key, [group])
  }

  return [...byOwner]
    .map(([key, groups]) => {
      groups.sort((a, b) => SUBSECTION_ORDER.indexOf(a.section) - SUBSECTION_ORDER.indexOf(b.section))
      return { key, title: sectionTitle(key), groups }
    })

    .sort((a, b) => sortKey(a.key).localeCompare(sortKey(b.key)))
})

function sortKey(key: string): string {
  if (key === 'communicationModule') return '0'
  const [sensor, channel] = key.split('.')
  const sensorPart = `1.${(sensor?.replace('sensor', '') ?? '0').padStart(2, '0')}`
  return channel ? `${sensorPart}.1.${channel.replace('channel', '').padStart(2, '0')}` : `${sensorPart}.0`
}

function sectionTitle(key: string): string {
  if (key === 'communicationModule') return t('encoder.tulip3.section.communicationModule')

  const sensorSection = key.match(/^sensor(\d+)$/)?.[1]
  if (sensorSection) return t('encoder.tulip3.section.sensor', { n: sensorSection })

  const channel = profile.value.channels.find(entry => entry.path === key)
  const number = key.match(/channel(\d+)$/)?.[1] ?? ''

  const label = props.channelLabels?.[key]
  if (label) return label

  // A single measurand names the channel best; unit-derived quantity and the channel number are fallbacks.
  const measurand = channel?.measurands?.length === 1 ? channel.measurands[0] : undefined
  const quantity = measurand
    ?? (channel?.quantity
      ? t(`encoder.tulip3.quantity.${channel.quantity}`)
      : t('encoder.tulip3.channelName', { n: number }))

  if (sensorCount.value < 2) return quantity
  const owningSensor = key.match(/^sensor(\d+)\./)?.[1]
  return owningSensor ? t('encoder.tulip3.quantityOnSensor', { quantity, n: owningSensor }) : quantity
}

const sensorCount = computed(() =>
  new Set(profile.value.groups.map(group => group.path.match(/^sensor\d+/)?.[0]).filter(Boolean)).size,
)

function registerLabel(name: string): string {
  const copy = REGISTER_COPY[name as keyof typeof REGISTER_COPY]

  return copy ? t(`encoder.tulip3.register.${copy.labelKey}`) : name
}

function registerUnit(name: string): string | undefined {
  return REGISTER_COPY[name as keyof typeof REGISTER_COPY]?.unit
}

const selectedRegisters = useRouteQuery<string>('t3Registers', '')
const registerList = computed(() =>
  selectedRegisters.value.split(',').map(entry => entry.trim()).filter(Boolean),
)

function toggleRegister(key: string, on: boolean) {
  const next = new Set(registerList.value)
  if (on) next.add(key)
  else next.delete(key)
  selectedRegisters.value = [...next].join(',')
}

const writeState = useRouteQuery<string>('t3w', '')

const writeValues = computed(() => {
  const map = new Map<string, string>()
  for (const pair of writeState.value.split(';')) {
    const separator = pair.indexOf(':')
    if (separator < 1) continue
    map.set(pair.slice(0, separator), decodeURIComponent(pair.slice(separator + 1)))
  }
  return map
})

function setWriteValue(key: string, raw: string) {
  const next = new Map(writeValues.value)
  if (raw === '') next.delete(key)
  else next.set(key, raw)
  writeState.value = [...next].map(([k, v]) => `${k}:${encodeURIComponent(v)}`).join(';')
}

const readValue = (key: string) => writeValues.value.get(key) ?? ''

function writableOf(group: GroupProfile): RegisterInfo[] {
  return group.registers.filter(register => register.facts.access === 'readWrite')
}

function advisory(register: RegisterInfo): string | undefined {
  const raw = readValue(register.key)
  if (raw === '') return undefined
  const value = Number(raw)
  if (!Number.isFinite(value)) return undefined

  const copy = REGISTER_COPY[register.name as keyof typeof REGISTER_COPY]
  const level = advisoryWarning(register.name, value)
  if (level === 'high') return t('encoder.tulip3.advisoryHigh', { max: copy?.advisoryMax ?? '' })
  if (level === 'low') return t('encoder.tulip3.advisoryLow', { min: copy?.advisoryMin ?? '' })
  return undefined
}

const CM = 'communicationModule.configuration'

const INTERVAL_BLOCKS = [
  { key: 'alarmOff', period: `${CM}.measuringPeriodAlarmOff`, rate: `${CM}.transmissionRateAlarmOff` },
  { key: 'alarmOn', period: `${CM}.measuringPeriodAlarmOn`, rate: `${CM}.transmissionRateAlarmOn` },
] as const

const isWritable = (register?: RegisterInfo): register is RegisterInfo => register?.facts.access === 'readWrite'

// Period and rate registers get the same "transmission intervals" block as TULIP2.
const intervalBlocks = computed(() => INTERVAL_BLOCKS.flatMap((block) => {
  const period = registerByKey.value.get(block.period)
  const rate = registerByKey.value.get(block.rate)
  return isWritable(period) && isWritable(rate) ? [{ key: block.key, period, rate }] : []
}))

const intervalRegisterKeys = computed(() =>
  new Set(intervalBlocks.value.flatMap(block => [block.period.key, block.rate.key])),
)

const intervalColumns = computed(() => [t('encoder.tulip3.intervalPeriod'), t('encoder.tulip3.intervalRate')])

const intervalRows = computed(() => intervalBlocks.value.map((block) => {
  const registers = [block.period, block.rate]
  return {
    key: block.key,
    label: t(`encoder.tulip3.transmit.${block.key}`),
    formula: intervalFormula(block),
    problem: intervalProblem(block),
    registers,
  }
}))

// The CSV limits the resulting interval, which no single register encodes, so it is checked here.
function intervalProblem(block: { period: RegisterInfo, rate: RegisterInfo }): string | undefined {
  const range = communicationLimits(props.slug)?.interval
  const periodRaw = readValue(block.period.key)
  const rateRaw = readValue(block.rate.key)
  if (!range || periodRaw === '' || rateRaw === '') return undefined
  if (limitProblem(block.period) || limitProblem(block.rate)) return undefined

  const interval = Number(periodRaw) * Number(rateRaw)
  return interval < range.min || interval > range.max
    ? t('encoder.tulip3.intervalLimit', { min: range.min, max: range.max })
    : undefined
}

function intervalFormula(block: { period: RegisterInfo, rate: RegisterInfo }): string | undefined {
  const period = Number(readValue(block.period.key))
  const rate = Number(readValue(block.rate.key))
  if (!(period > 0) || !(rate > 0)) return undefined
  return t('encoder.tulip3.transmitFormula', { period, rate, interval: formatDuration(period * rate) })
}

function limitProblem(register: RegisterInfo): string | undefined {
  const { facts } = register
  if (facts.access !== 'readWrite' || (facts.control !== 'number' && facts.control !== 'integer')) return undefined
  return limitViolation(facts, readValue(register.key)) ? limitMessage(t, facts) : undefined
}

function writeLimitErrors(): string[] {
  const intervalErrors = intervalBlocks.value.flatMap((block) => {
    const limit = intervalProblem(block)
    return limit ? [t('encoder.tulip3.limitError', { register: t(`encoder.tulip3.transmit.${block.key}`), limit })] : []
  })

  const registerErrors = [...registerByKey.value.values()]
    .filter(register => limitProblem(register))
    .map(register => t('encoder.tulip3.limitError', {
      register: registerLabel(register.name),
      limit: limitProblem(register),
    }))

  return [...registerErrors, ...intervalErrors]
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return String(seconds)

  const units: [number, string][] = [[86400, 'd'], [3600, 'h'], [60, 'min'], [1, 's']]
  const parts: string[] = []
  let rest = Math.floor(seconds)
  for (const [size, suffix] of units) {
    const amount = Math.floor(rest / size)
    if (amount > 0) {
      parts.push(`${amount} ${suffix}`)
      rest -= amount * size
    }
    if (parts.length === 2) break
  }
  return parts.join(' ')
}

function assign(root: Record<string, unknown>, dotPath: string, value: unknown) {
  const segments = dotPath.split('.')
  const leaf = segments.pop()
  if (!leaf) return
  let node = root
  for (const segment of segments) {
    node[segment] ??= {}
    node = node[segment] as Record<string, unknown>
  }
  node[leaf] = value
}

function typedValue(register: RegisterInfo, raw: string): unknown {
  const { facts } = register
  if (facts.access !== 'readWrite') return undefined

  switch (facts.control) {
    case 'number':
    case 'integer': {
      const value = Number(raw)
      return Number.isFinite(value) ? value : undefined
    }
    case 'boolean':
      return raw === 'true'
    case 'select':
      return facts.options.includes(raw) ? raw : undefined
    case 'flags':
    case 'channelSet': {
      // An entry left undecided would be switched off, so the set is only sent once every entry is chosen.
      const members = setMembers(register)
      const decided = parseSet(raw)
      return members.every(member => decided.has(member))
        ? Object.fromEntries(members.map(member => [member, decided.get(member)]))
        : undefined
    }
    case 'unenumerable':

      return undefined
  }
}

// Channel entries are named like the channel cards below instead of by their register keys.
function memberLabels(register: RegisterInfo): Record<string, string> | undefined {
  if (register.facts.access !== 'readWrite' || register.facts.control !== 'channelSet') return undefined
  const sensor = register.key.split('.')[0]
  return Object.fromEntries(register.facts.keys.map(key => [key, sectionTitle(`${sensor}.${key}`)]))
}

function incompleteSets(): string[] {
  return [...registerByKey.value.values()].flatMap((register) => {
    const missing = undecidedMembers(readValue(register.key), setMembers(register))
    if (!missing.length) return []

    const labels = memberLabels(register)
    return [t('encoder.tulip3.setIncomplete', {
      register: registerLabel(register.name),
      missing: missing.map(member => labels?.[member] ?? t(`encoder.tulip3.alarmFlag.${member}`)).join(', '),
    })]
  })
}

function buildWriteInput(): Record<string, unknown> {
  const root: Record<string, unknown> = {}
  for (const [key, raw] of writeValues.value) {
    const register = registerByKey.value.get(key)
    if (!register || raw === '') continue
    const value = typedValue(register, raw)
    if (value !== undefined) assign(root, key, value)
  }
  return root
}

const { result, publish } = provideDownlinkResult()

function actionNeedsInput(value: ActionValue): boolean {
  return ACTIONS_WITH_INPUTS.includes(value)
}

function selectAction(value: ActionValue) {
  action.value = value
}

watch(selected, (value) => {
  if (action.value !== value) action.value = value
}, { immediate: true })

// Incomplete input is a hint, not an error: the frame is re-encoded while the user types.
function buildResult(): DownlinkResult {
  const actionName = selected.value

  let input: Record<string, unknown>
  if (needsAlarmFlags.value) {
    const requested = [processAlarm, cmAlarm, sensorAlarm, channelAlarm].map(query => query.value === 'true')
    if (!requested.some(Boolean)) return { hint: t('encoder.tulip3.noAlarmTypes') }

    input = {
      action: actionName,
      input: {
        processAlarmRequested: processAlarm.value === 'true',
        cmAlarmRequested: cmAlarm.value === 'true',
        sensorAlarmRequested: sensorAlarm.value === 'true',
        channelAlarmRequested: channelAlarm.value === 'true',
      },
    }
  }
  else if (isReading.value) {
    const entries = [...registerList.value]
    if (entries.length === 0) return { hint: t('encoder.tulip3.noRegisters') }
    input = { action: actionName, input: buildRegisterSelection(entries) }
  }
  else if (isWriting.value) {
    const written = buildWriteInput()
    const outOfRange = writeLimitErrors()
    if (outOfRange.length) return { errors: outOfRange }
    const incomplete = incompleteSets()
    if (incomplete.length) return { hint: incomplete.join(' ') }
    if (Object.keys(written).length === 0) return { hint: t('encoder.tulip3.noValues') }
    input = { action: actionName, input: written }
  }
  else {
    input = { action: actionName }
  }

  if (usesByteLimit.value && byteLimit.value !== '') {
    if (byteLimitError.value) return { hint: byteLimitError.value }
    input.metadata = { byteLimit: Number(byteLimit.value) }
  }

  return encodeFrames(props.encodeDownlink, props.encodeMultipleDownlinks, { protocol: 'TULIP3', input })
}

useLiveEncode(buildResult, publish)

const hasInput = computed(() => writeState.value !== ''
  || selectedRegisters.value !== ''
  || byteLimit.value !== ''
  || [processAlarm, cmAlarm, sensorAlarm, channelAlarm].some(query => query.value !== 'false'))

function resetForm() {
  writeState.value = ''
  selectedRegisters.value = ''
  byteLimit.value = ''
  for (const query of [processAlarm, cmAlarm, sensorAlarm, channelAlarm]) query.value = 'false'
  toggledSections.value = new Map()
}

const directOptions = DIRECT_ACTIONS.map(value => ({
  value,
  label: t(`encoder.tulip3.action.${value}`),
}))

const optionsWithInputs = ACTIONS_WITH_INPUTS.map(value => ({
  value,
  label: t(`encoder.tulip3.action.${value}`),
}))

const toggledSections = shallowRef(new Map<string, boolean>())

// Writing only lists writable registers; the interval registers live in their own block.
function writableRegisters(section: Section): RegisterInfo[] {
  return section.groups.flatMap(writableOf).filter(register => !intervalRegisterKeys.value.has(register.key))
}

const GENERAL_SECTION = 'communicationModule'

// Writing: the communication module is the boxed "Communication" block, every other section is a collapsible card.
const generalRegisters = computed(() => {
  const general = sections.value.find(section => section.key === GENERAL_SECTION)
  return general ? writableRegisters(general) : []
})

const channelSections = computed(() =>
  isReading.value
    ? sections.value
    : sections.value.filter(section => section.key !== GENERAL_SECTION && writableRegisters(section).length > 0),
)

const channelsTitle = computed(() =>
  channelSections.value.some(section => /^sensor\d+$/.test(section.key))
    ? t('encoder.sensorsAndChannels')
    : t('encoder.channels'),
)

const ALARM_VALUES = [
  'processAlarmDeadBand',
  'lowThresholdAlarmValue',
  'highThresholdAlarmValue',
  'risingSlopeAlarmValue',
  'fallingSlopeAlarmValue',
]

const DELAYED_PAIRS = [
  { value: 'lowThresholdWithDelayAlarmValue', delay: 'lowThresholdWithDelayAlarmDelay' },
  { value: 'highThresholdWithDelayAlarmValue', delay: 'highThresholdWithDelayAlarmDelay' },
]

// Multi-line controls get their own full-width row instead of stretching a grid row.
const isWide = (register: RegisterInfo) => register.facts.access === 'readWrite'
  && ['flags', 'channelSet', 'unenumerable'].includes(register.facts.control)

// Same order as TULIP2: basics, alarm values, then the delayed thresholds as one accented block.
function writeLayout(section: Section) {
  const registers = writableRegisters(section)
  const byName = new Map(registers.map(register => [register.name, register]))
  const delayed = DELAYED_PAIRS.flatMap((pair) => {
    const value = byName.get(pair.value)
    const delay = byName.get(pair.delay)
    return value && delay ? [{ key: pair.value, value, delay }] : []
  })
  const paired = new Set(delayed.flatMap(pair => [pair.value.name, pair.delay.name]))
  const rest = registers.filter(register => !paired.has(register.name))

  return {
    basics: rest.filter(register => !isWide(register) && !ALARM_VALUES.includes(register.name)),
    wide: rest.filter(isWide),
    alarms: ALARM_VALUES.flatMap(name => rest.filter(register => register.name === name)),
    delayed,
  }
}

const writeLayouts = computed(() =>
  new Map(channelSections.value.map(section => [section.key, writeLayout(section)])),
)

const layoutOf = (section: Section) => writeLayouts.value.get(section.key) ?? writeLayout(section)

function sectionCount(section: Section): number {
  if (isReading.value) {
    return section.groups.reduce((total, group) =>
      total + group.registers.filter(register => registerList.value.includes(register.key)).length, 0)
  }
  return writableRegisters(section).filter(register => readValue(register.key) !== '').length
}

// Sections holding input stay open; the user's own toggle always wins.
function isSectionOpen(section: Section): boolean {
  return toggledSections.value.get(section.key) ?? sectionCount(section) > 0
}

function toggleSection(section: Section) {
  const next = new Map(toggledSections.value)
  next.set(section.key, !isSectionOpen(section))
  toggledSections.value = next
}

function sectionBadge(section: Section): string | undefined {
  const count = sectionCount(section)
  if (!count) return undefined
  if (isReading.value) return t('encoder.tulip3.countSelected', { count })
  // A count of 1 on a card with a single writable register says nothing beyond "edited".
  return writableRegisters(section).length === 1
    ? t('encoder.tulip3.edited')
    : t('encoder.tulip3.countFilled', { count }, count)
}
</script>

<template>
  <SplitPane>
    <template #input>
      <div class="flex flex-col w-full gap-6">
        <EncoderSection :title="t('encoder.tulip3.actionLabel')">
          <template
            v-if="actionNeedsInput(selected)"
            #actions
          >
            <div class="flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
              <div
                v-if="usesByteLimit"
                class="flex items-center gap-2"
              >
                <label
                  for="t3-byte-limit"
                  class="flex items-center gap-1 text-sm text-muted"
                >
                  {{ t('encoder.tulip3.byteLimit') }}
                  <FieldProblem
                    v-if="byteLimitError"
                    :message="byteLimitError"
                  />
                  <UPopover arrow>
                    <UButton
                      icon="mdi:help-circle"
                      size="xs"
                      variant="link"
                      class="p-0"
                      :aria-label="t('encoder.tulip3.byteLimitHelpLabel')"
                    />
                    <template #content>
                      <div class="max-w-md p-2">
                        {{ t('encoder.tulip3.byteLimitHelp') }}
                      </div>
                    </template>
                  </UPopover>
                </label>
                <ClearableInput
                  id="t3-byte-limit"
                  v-model="byteLimit"
                  size="sm"
                  class="w-24"
                  placeholder="51"
                  unit="B"
                  :block="false"
                  :clearable="false"
                  :min="MIN_BYTE_LIMIT"
                  :color="byteLimitError ? 'error' : undefined"
                />
              </div>
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                icon="mdi:restore"
                :label="t('encoder.reset')"
                :disabled="!hasInput"
                @click="resetForm"
              />
            </div>
          </template>
          <ActionPicker
            :direct="directOptions"
            :with-inputs="optionsWithInputs"
            :selected="selected"
            :direct-label="t('encoder.tulip3.directActionsLabel')"
            :inputs-label="t('encoder.tulip3.actionsWithInputsLabel')"
            @select="value => selectAction(value as ActionValue)"
          />
        </EncoderSection>

        <div
          v-if="actionNeedsInput(selected)"
          class="flex flex-col gap-6 border-t border-default pt-6"
        >
          <EncoderSection
            v-if="needsAlarmFlags"
            :level="3"
            boxed
            :title="t('encoder.tulip3.alarmsTitle')"
          >
            <div class="grid gap-2 sm:grid-cols-2">
              <UCheckbox
                :model-value="processAlarm === 'true'"
                :label="t('encoder.tulip3.processAlarmRequested')"
                @update:model-value="value => processAlarm = value ? 'true' : 'false'"
              />
              <UCheckbox
                :model-value="cmAlarm === 'true'"
                :label="t('encoder.tulip3.cmAlarmRequested')"
                @update:model-value="value => cmAlarm = value ? 'true' : 'false'"
              />
              <UCheckbox
                :model-value="sensorAlarm === 'true'"
                :label="t('encoder.tulip3.sensorAlarmRequested')"
                @update:model-value="value => sensorAlarm = value ? 'true' : 'false'"
              />
              <UCheckbox
                :model-value="channelAlarm === 'true'"
                :label="t('encoder.tulip3.channelAlarmRequested')"
                @update:model-value="value => channelAlarm = value ? 'true' : 'false'"
              />
            </div>
          </EncoderSection>

          <EncoderSection
            v-if="isWriting && (intervalBlocks.length || generalRegisters.length)"
            :level="3"
            boxed
            :title="t('encoder.communication')"
          >
            <IntervalBlocks
              v-if="intervalRows.length"
              :rows="intervalRows"
              :columns="intervalColumns"
            >
              <template #cell="{ row, columnIndex }">
                <FormField
                  :label="intervalColumns[columnIndex]"
                  :problem="limitProblem(row.registers[columnIndex]!)"
                  :notice="advisory(row.registers[columnIndex]!)"
                  :name="row.registers[columnIndex]!.key"
                >
                  <EncodersTulip3RegisterInput
                    :model-value="readValue(row.registers[columnIndex]!.key)"
                    :register="row.registers[columnIndex]!"
                    :unit="columnIndex === 0 ? 's' : undefined"
                    @update:model-value="value => setWriteValue(row.registers[columnIndex]!.key, value)"
                  />
                </FormField>
              </template>
            </IntervalBlocks>

            <div
              v-if="generalRegisters.length"
              class="grid gap-x-6 ps-3.5 sm:grid-cols-2"
            >
              <FormField
                v-for="register in generalRegisters"
                :key="register.key"
                :label="registerLabel(register.name)"
                :problem="limitProblem(register)"
                :notice="advisory(register)"
                :name="register.key"
              >
                <EncodersTulip3RegisterInput
                  :model-value="readValue(register.key)"
                  :register="register"
                  :unit="registerUnit(register.name)"
                  :member-labels="memberLabels(register)"
                  @update:model-value="value => setWriteValue(register.key, value)"
                />
              </FormField>
            </div>
          </EncoderSection>

          <EncoderSection
            v-if="isReading || (isWriting && channelSections.length)"
            :level="3"
            :title="isWriting ? channelsTitle : t('encoder.tulip3.readTitle')"
          >
            <div class="flex flex-col gap-3">
              <CollapsibleCard
                v-for="section in channelSections"
                :key="section.key"
                :title="section.title"
                :badge="sectionBadge(section)"
                :open="isSectionOpen(section)"
                @toggle="toggleSection(section)"
              >
                <template v-if="isReading">
                  <div
                    v-for="group in section.groups"
                    :key="group.path"
                    class="flex flex-col gap-1 not-first:mt-4"
                  >
                    <OverlineLabel tag="p">
                      {{ t(`encoder.tulip3.subsection.${group.section}`) }}
                    </OverlineLabel>

                    <div class="mt-1 grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-x-4 gap-y-1">
                      <UCheckbox
                        v-for="register in group.registers"
                        :key="register.key"
                        :model-value="registerList.includes(register.key)"
                        :label="registerLabel(register.name)"
                        :ui="{ label: 'font-normal' }"
                        @update:model-value="on => toggleRegister(register.key, !!on)"
                      />
                    </div>
                  </div>
                </template>

                <div
                  v-else
                  class="flex flex-col gap-4"
                >
                  <div
                    v-if="layoutOf(section).basics.length"
                    class="grid gap-x-6 sm:grid-cols-2"
                  >
                    <FormField
                      v-for="register in layoutOf(section).basics"
                      :key="register.key"
                      :label="registerLabel(register.name)"
                      :problem="limitProblem(register)"
                      :notice="advisory(register)"
                      :name="register.key"
                    >
                      <EncodersTulip3RegisterInput
                        :model-value="readValue(register.key)"
                        :register="register"
                        :unit="registerUnit(register.name)"
                        @update:model-value="value => setWriteValue(register.key, value)"
                      />
                    </FormField>
                  </div>

                  <div
                    v-for="register in layoutOf(section).wide"
                    :key="register.key"
                    role="group"
                    :aria-label="registerLabel(register.name)"
                    class="flex flex-col gap-2"
                  >
                    <div>
                      <OverlineLabel tag="p">
                        {{ registerLabel(register.name) }}
                      </OverlineLabel>
                      <p
                        v-if="setMembers(register).length"
                        class="mt-0.5 text-xs text-muted"
                      >
                        {{ t('encoder.tulip3.setNote') }}
                      </p>
                    </div>
                    <EncodersTulip3RegisterInput
                      :model-value="readValue(register.key)"
                      :register="register"
                      :member-labels="memberLabels(register)"
                      @update:model-value="value => setWriteValue(register.key, value)"
                    />
                  </div>

                  <div
                    v-if="layoutOf(section).alarms.length"
                    class="grid gap-x-6 sm:grid-cols-2"
                  >
                    <FormField
                      v-for="register in layoutOf(section).alarms"
                      :key="register.key"
                      :label="registerLabel(register.name)"
                      :problem="limitProblem(register)"
                      :notice="advisory(register)"
                      :name="register.key"
                    >
                      <EncodersTulip3RegisterInput
                        :model-value="readValue(register.key)"
                        :register="register"
                        :unit="registerUnit(register.name)"
                        @update:model-value="value => setWriteValue(register.key, value)"
                      />
                    </FormField>
                  </div>

                  <section
                    v-if="layoutOf(section).delayed.length"
                    class="border-l-2 border-primary/40 ps-3"
                  >
                    <OverlineLabel>{{ t('encoder.tulip3.delayedThresholdsTitle') }}</OverlineLabel>
                    <div class="mt-2 grid gap-3 sm:grid-cols-2">
                      <div
                        v-for="pair in layoutOf(section).delayed"
                        :key="pair.key"
                        class="min-w-0"
                      >
                        <p class="text-sm font-medium text-highlighted">
                          {{ registerLabel(pair.value.name) }}
                          <FieldProblem
                            v-if="limitProblem(pair.value) ?? limitProblem(pair.delay)"
                            :message="(limitProblem(pair.value) ?? limitProblem(pair.delay))!"
                          />
                        </p>
                        <div class="mt-1.5 grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
                          <div class="flex min-w-0 flex-col gap-1">
                            <span
                              class="text-xs text-dimmed"
                              aria-hidden="true"
                            >{{ t('encoder.tulip3.delayedThresholdValue') }}</span>
                            <FormField
                              :label="registerLabel(pair.value.name)"
                              hide-label
                              :problem="limitProblem(pair.value)"
                              :name="pair.value.key"
                            >
                              <EncodersTulip3RegisterInput
                                :model-value="readValue(pair.value.key)"
                                :register="pair.value"
                                @update:model-value="value => setWriteValue(pair.value.key, value)"
                              />
                            </FormField>
                          </div>
                          <div class="flex min-w-0 flex-col gap-1">
                            <span
                              class="text-xs text-dimmed"
                              aria-hidden="true"
                            >{{ t('encoder.tulip3.delayedThresholdDelay') }}</span>
                            <FormField
                              :label="registerLabel(pair.delay.name)"
                              hide-label
                              :problem="limitProblem(pair.delay)"
                              :name="pair.delay.key"
                            >
                              <EncodersTulip3RegisterInput
                                :model-value="readValue(pair.delay.key)"
                                :register="pair.delay"
                                @update:model-value="value => setWriteValue(pair.delay.key, value)"
                              />
                            </FormField>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </CollapsibleCard>
            </div>
          </EncoderSection>
        </div>
      </div>
    </template>

    <template #result>
      <FramePanel
        :frames="result.frames"
        :f-port="result.fPort"
        :errors="result.errors"
        :hint="result.hint"
      />
    </template>
  </SplitPane>
</template>
