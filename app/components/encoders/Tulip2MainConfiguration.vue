<script setup lang="ts">
import type { DownlinkResult } from '~/composables/useDownlinkResult'
import type { MainConfigurationField } from '~/utils/tulip2Actions'
import { resolveMainConfiguration, writesConfigurationId } from '~/utils/tulip2Actions'
import { channelFieldGroup, limitMessage, limitViolation, probeChannel, rangePlaceholder, resolveChannelKeys } from '~/utils/tulip2Channels'
import { convertSecondsToHMS } from '~/utils/time'
import { encodeFrames } from '~/utils/encodeFrames'

const props = defineProps<{
  encodeMultipleDownlinks?: (input: never) => unknown
  encodeDownlink: (input: never) => unknown

  channelLabels?: Readonly<Record<string, string>>
}>()

const { t } = useI18n()

const fields = computed(() => resolveMainConfiguration(props.encodeDownlink))

const configurationIdAnswer = computed(() => writesConfigurationId(props.encodeDownlink, {
  deviceAction: 'configuration',
  mainConfiguration: Object.fromEntries(
    fields.value.map(field => [field.name, field.type === 'boolean' ? true : field.min ?? 1]),
  ),
}))

const showConfigurationId = computed(() => configurationIdAnswer.value !== 'no')

const configurationId = useRouteQuery<string>('t2ConfigId', '1')

const values = useRouteQuery<string>('t2Main', '')

const parsed = computed(() => {
  const map = new Map<string, string>()
  for (const pair of values.value.split(';')) {
    const separator = pair.indexOf(':')
    if (separator < 1) continue
    map.set(pair.slice(0, separator), pair.slice(separator + 1))
  }
  return map
})

const read = (name: string) => parsed.value.get(name) ?? ''

function write(name: string, raw: string) {
  const next = new Map(parsed.value)
  if (raw === '') next.delete(name)
  else next.set(name, raw)
  values.value = [...next].map(([k, v]) => `${k}:${v}`).join(';')
}

const booleanItems = computed(() => [
  { label: t('encoder.tulip2.booleanTrue'), value: 'true' },
  { label: t('encoder.tulip2.booleanFalse'), value: 'false' },
])

const transmissionFields = computed(() => fields.value.filter(field => [
  'measuringRateWhenNoAlarm',
  'publicationFactorWhenNoAlarm',
  'measuringRateWhenAlarm',
  'publicationFactorWhenAlarm',
].includes(field.name)))

function fieldsInOrder(names: readonly string[]): MainConfigurationField[] {
  return names.flatMap(name => fields.value.filter(field => field.name === name))
}

const noAlarmTransmissionFields = computed(() => fieldsInOrder([
  'measuringRateWhenNoAlarm',
  'publicationFactorWhenNoAlarm',
]))

const alarmTransmissionFields = computed(() => fieldsInOrder([
  'measuringRateWhenAlarm',
  'publicationFactorWhenAlarm',
]))

const bluetoothField = computed(() => fields.value.find(field => field.name === 'isBLEEnabled'))

const otherFields = computed(() => fields.value.filter(field =>
  !transmissionFields.value.includes(field) && field !== bluetoothField.value,
))

function formatInterval(seconds: number): string {
  const { hours, minutes, seconds: remainder } = convertSecondsToHMS(seconds)
  return [
    hours ? `${hours} h` : '',
    minutes ? `${minutes} min` : '',
    remainder ? `${remainder} s` : '',
  ].filter(Boolean).join(' ')
}

const isSeconds = (name: string) => name.startsWith('measuringRate')

function mainProblem(field: MainConfigurationField): string | undefined {
  return limitViolation(field, read(field.name)) ? limitMessage(t, field) : undefined
}

// Main settings are written together, so once one is filled the empty ones are flagged; channels stay independent.
const mainStarted = computed(() => fields.value.some(field => read(field.name) !== ''))

function fieldProblem(field: MainConfigurationField): string | undefined {
  return mainProblem(field) ?? (mainStarted.value && read(field.name) === '' ? t('encoder.required') : undefined)
}

function mainLimitErrors(): string[] {
  return fields.value
    .filter(field => field.type === 'number' && mainProblem(field))
    .map(field => t('encoder.tulip2.mainLimitError', {
      field: t(`encoder.tulip2.main.${field.name}`),
      limit: limitMessage(t, field),
    }))
}

const intervalColumns = computed(() => [t('encoder.tulip2.transmissionRate'), t('encoder.tulip2.transmissionFactor')])

const intervalRows = computed(() => [
  {
    key: 'noAlarm',
    label: t('encoder.tulip2.transmissionNoAlarm'),
    formula: transmissionFormula('measuringRateWhenNoAlarm', 'publicationFactorWhenNoAlarm'),
    fields: noAlarmTransmissionFields.value,
  },
  {
    key: 'alarm',
    label: t('encoder.tulip2.transmissionAlarm'),
    formula: transmissionFormula('measuringRateWhenAlarm', 'publicationFactorWhenAlarm'),
    fields: alarmTransmissionFields.value,
  },
]
  .filter(row => row.fields.length > 0))

function transmissionFormula(rateName: string, factorName: string): string | undefined {
  const rate = Number(read(rateName))
  const factor = Number(read(factorName))
  if (!Number.isFinite(rate) || !Number.isFinite(factor) || rate <= 0 || factor <= 0) return undefined

  return t('encoder.tulip2.transmissionFormula', {
    rate,
    factor,
    interval: formatInterval(rate * factor),
  })
}

const channelKeys = computed(() => resolveChannelKeys(props.encodeDownlink))

const openChannels = ref(new Set<string>())

function toggleChannel(channel: string) {
  const next = new Set(openChannels.value)
  if (next.has(channel)) next.delete(channel)
  else next.add(channel)
  openChannels.value = next
}

const channelValues = useRouteQuery<string>('t2Chan', '')

const parsedChannels = computed(() => {
  const map = new Map<string, string>()
  for (const pair of channelValues.value.split(';')) {
    const separator = pair.indexOf(':')
    if (separator < 1) continue
    map.set(pair.slice(0, separator), pair.slice(separator + 1))
  }
  return map
})

function channelCount(channel: string): number {
  let count = 0
  for (const [key, raw] of parsedChannels.value) {
    if (key.startsWith(`${channel}.`) && raw !== '') count++
  }
  return count
}

function channelLabel(channel: string): string {
  return props.channelLabels?.[channel]
    ?? t('encoder.tulip2.channel.name', { n: Number(channel.replace('channel', '')) + 1 })
}

// Keyed by a string so keystrokes do not re-run the expensive probe.
const probedChannelNames = computed(() => {
  const names = new Set(openChannels.value)
  for (const key of parsedChannels.value.keys()) {
    const channel = key.split('.')[0]
    if (channel) names.add(channel)
  }
  return [...names].sort().join(',')
})

const channelProbes = computed(() => new Map(
  probedChannelNames.value.split(',').filter(Boolean)
    .map(channel => [channel, probeChannel(props.encodeDownlink, channel)] as const),
))

const channelFieldGroups = computed(() => {
  const groups = new Map<string, 'alarms' | 'channel'>()
  for (const probe of channelProbes.value.values()) {
    for (const field of probe.fields) groups.set(field.name, field.group)
  }
  return groups
})

function limitErrors(): string[] {
  const errors: string[] = []
  for (const [key, raw] of parsedChannels.value) {
    const [channel, fieldName, property] = key.split('.')
    if (!channel || !fieldName) continue
    const field = property === 'delay'
      ? { min: 0, max: 65535 }
      : channelProbes.value.get(channel)?.fields.find(entry => entry.name === fieldName)
    if (!field || !limitViolation(field, raw)) continue
    errors.push(t('encoder.tulip2.channel.limitError', {
      channel: channelLabel(channel),
      field: t(`encoder.tulip2.channel.field.${fieldName}`),
      limit: limitMessage(t, field),
    }))
  }
  return errors
}

const publish = useDownlinkResult()

function valueOf(field: MainConfigurationField): unknown {
  const raw = read(field.name)
  if (field.type === 'boolean') return raw === 'true'
  if (field.type === 'number') return Number(raw)
  return raw
}

const DELAYED_THRESHOLD_FIELDS = new Set(['lowThresholdWithDelay', 'highThresholdWithDelay'])

function channelPayloads(): { payload: Record<string, unknown>, errors: string[] } {
  const byChannel = new Map<string, { alarms: Record<string, unknown>, own: Record<string, number> }>()
  const switched = new Map<string, boolean>()

  for (const [key, raw] of parsedChannels.value) {
    const [channel, field, property] = key.split('.')
    if (!channel || !field || raw === '') continue

    if (field === 'state') {
      if (raw === 'true' || raw === 'false') switched.set(channel, raw === 'true')
      continue
    }

    const entry = byChannel.get(channel) ?? { alarms: {}, own: {} }

    const fieldGroup = key.slice(channel.length + 1)
    const group = channelFieldGroups.value.get(fieldGroup) ?? channelFieldGroup(fieldGroup) ?? 'alarms'
    if (property && DELAYED_THRESHOLD_FIELDS.has(field)) {
      const delayed = entry.alarms[field] as Record<string, number> | undefined ?? {}
      delayed[property] = Number(raw)
      entry.alarms[field] = delayed
    }
    else if (group === 'alarms') entry.alarms[field] = Number(raw)
    else entry.own[field] = Number(raw)
    byChannel.set(channel, entry)
  }

  const errors: string[] = []
  for (const entry of byChannel.values()) {
    for (const field of DELAYED_THRESHOLD_FIELDS) {
      const delayed = entry.alarms[field]
      if (!delayed || typeof delayed !== 'object') continue
      const values = delayed as Record<string, number>
      if ('value' in values && 'delay' in values) continue
      errors.push(t('encoder.tulip2.channel.delayedThresholdIncomplete', {
        field: t(`encoder.tulip2.channel.field.${field}`),
      }))
    }
  }

  const payload: Record<string, unknown> = {}
  for (const [channel, entry] of byChannel) {
    if (switched.has(channel)) continue
    const hasAlarms = Object.keys(entry.alarms).length > 0
    payload[channel] = hasAlarms ? { ...entry.own, alarms: entry.alarms } : { ...entry.own }
  }
  for (const [channel, value] of switched) payload[channel] = value
  return { payload, errors }
}

const configurationIdError = computed(() => {
  const parsed = Number(configurationId.value)
  return Number.isInteger(parsed) && parsed >= 1 ? undefined : t('encoder.tulip2.invalidConfigurationId')
})

type ChannelConfiguration = { alarms?: Record<string, unknown> } & Record<string, unknown>

function configuredChannels(channels: Record<string, unknown>): [string, ChannelConfiguration][] {
  return Object.entries(channels).filter((entry): entry is [string, ChannelConfiguration] =>
    typeof entry[1] === 'object' && entry[1] !== null)
}

function missingDeadBand(channels: Record<string, unknown>): string[] {
  return configuredChannels(channels)
    .filter(([, value]) => value.alarms && !('deadBand' in value.alarms))
    .map(([channel]) => t('encoder.tulip2.channel.deadBandRequired', { channel: channelLabel(channel) }))
}

function without<T extends Record<string, unknown>>(source: T, key: string): Record<string, unknown> {
  return Object.fromEntries(Object.entries(source).filter(([name]) => name !== key))
}

// The parser only reports "invalid channel"; removing one field at a time finds the one it rejects.
function explainChannelRejection(channels: Record<string, unknown>): string[] {
  const accepts = (channel: string, candidate: unknown) => {
    const outcome = props.encodeDownlink({
      protocol: 'TULIP2',
      input: { deviceAction: 'configuration', [channel]: candidate },
    } as never) as { errors?: string[] }
    return !outcome.errors
  }

  return configuredChannels(channels).flatMap(([channel, value]) => {
    if (accepts(channel, value)) return []

    const { alarms, ...own } = value
    const culprits = [
      ...Object.keys(own).filter(key => accepts(channel, { ...without(own, key), ...(alarms ? { alarms } : {}) })),
      ...Object.keys(alarms ?? {})
        .filter(key => key !== 'deadBand' && accepts(channel, { ...own, alarms: without(alarms!, key) })),
    ]

    if (!culprits.length) return [t('encoder.tulip2.channel.rejectedChannel', { channel: channelLabel(channel) })]
    return culprits.map(field => t('encoder.tulip2.channel.rejectedField', {
      channel: channelLabel(channel),
      field: t(`encoder.tulip2.channel.field.${field}`),
    }))
  })
}

// Incomplete input is a hint, not an error: the frame is re-encoded while the user types.
function buildResult(): DownlinkResult {
  const { payload: channels, errors: channelErrors } = channelPayloads()
  const filled = fields.value.filter(field => read(field.name) !== '')

  if (channelErrors.length) return { hint: channelErrors.join(' ') }
  const mainLimits = mainLimitErrors()
  if (mainLimits.length) return { errors: mainLimits }
  const outOfRange = limitErrors()
  if (outOfRange.length) return { errors: outOfRange }
  const noDeadBand = missingDeadBand(channels)
  if (noDeadBand.length) return { hint: noDeadBand.join(' ') }
  if (filled.length && filled.length !== fields.value.length) {
    const missing = fields.value
      .filter(field => read(field.name) === '')
      .map(field => t(`encoder.tulip2.main.${field.name}`))
    return { hint: t('encoder.tulip2.mainMissing', { fields: missing.join(', ') }) }
  }
  if (!filled.length && Object.keys(channels).length === 0) return { hint: t('encoder.tulip2.nothingToSend') }

  const input: Record<string, unknown> = { deviceAction: 'configuration', ...channels }
  if (filled.length) {
    input.mainConfiguration = Object.fromEntries(
      fields.value.map(field => [field.name, valueOf(field)]),
    )
  }
  if (showConfigurationId.value) {
    if (configurationIdError.value) return { hint: configurationIdError.value }
    input.configurationId = Number(configurationId.value)
  }

  const encoded = encodeFrames(props.encodeDownlink, props.encodeMultipleDownlinks, { protocol: 'TULIP2', input })
  if (!encoded.errors?.some(error => /at channel\d+/.test(error))) return encoded

  const explained = explainChannelRejection(channels)
  return explained.length ? { errors: explained } : encoded
}

useLiveEncode(buildResult, publish)
</script>

<template>
  <div class="flex flex-col gap-6">
    <EncoderSection
      v-if="transmissionFields.length || bluetoothField || otherFields.length"
      :level="3"
      boxed
      :title="t('encoder.mainSettings')"
      :subtitle="t('encoder.tulip2.mainNote')"
    >
      <IntervalBlocks
        v-if="intervalRows.length"
        :rows="intervalRows"
        :columns="intervalColumns"
      >
        <template #cell="{ row, columnIndex }">
          <FormField
            v-if="row.fields[columnIndex]"
            :label="intervalColumns[columnIndex]"
            :problem="fieldProblem(row.fields[columnIndex])"
            :name="row.fields[columnIndex].name"
          >
            <ClearableInput
              :model-value="read(row.fields[columnIndex].name)"
              :unit="isSeconds(row.fields[columnIndex].name) ? 's' : undefined"
              :min="row.fields[columnIndex].min"
              :max="row.fields[columnIndex].max"
              :placeholder="rangePlaceholder(row.fields[columnIndex])"
              @update:model-value="value => write(row.fields[columnIndex]!.name, value)"
            />
          </FormField>
        </template>
      </IntervalBlocks>

      <div
        v-if="bluetoothField || otherFields.length"
        class="grid gap-x-4 ps-3.5 sm:grid-cols-2"
      >
        <FormField
          v-if="bluetoothField"
          :label="t(`encoder.tulip2.main.${bluetoothField.name}`)"
          :problem="fieldProblem(bluetoothField)"
          :name="bluetoothField.name"
        >
          <OptionalSelect
            :model-value="read(bluetoothField.name)"
            :items="booleanItems"
            :placeholder="t('encoder.select')"
            @update:model-value="value => write(bluetoothField!.name, value)"
          />
        </FormField>

        <FormField
          v-for="field in otherFields"
          :key="field.name"
          :label="t(`encoder.tulip2.main.${field.name}`)"
          :problem="fieldProblem(field)"
          :name="field.name"
        >
          <OptionalSelect
            v-if="field.type === 'boolean'"
            :model-value="read(field.name)"
            :items="booleanItems"
            :placeholder="t('encoder.select')"
            @update:model-value="value => write(field.name, value)"
          />
          <ClearableInput
            v-else
            :model-value="read(field.name)"
            :type="field.type === 'number' ? 'number' : 'text'"
            :unit="isSeconds(field.name) ? 's' : undefined"
            :min="field.min"
            :max="field.max"
            :placeholder="rangePlaceholder(field)"
            @update:model-value="value => write(field.name, value)"
          />
        </FormField>
      </div>
    </EncoderSection>

    <EncoderSection
      v-if="channelKeys.length"
      :level="3"
      :title="t('encoder.channels')"
    >
      <div class="flex flex-col gap-3">
        <CollapsibleCard
          v-for="channel in channelKeys"
          :key="channel"
          :title="channelLabel(channel)"
          :badge="channelCount(channel) ? t('encoder.tulip2.channel.count', { count: channelCount(channel) }, channelCount(channel)) : undefined"
          :open="openChannels.has(channel)"
          @toggle="toggleChannel(channel)"
        >
          <EncodersTulip2ChannelConfiguration
            :encode-downlink="props.encodeDownlink"
            :channel="channel"
          />
        </CollapsibleCard>
      </div>
    </EncoderSection>
  </div>
</template>
