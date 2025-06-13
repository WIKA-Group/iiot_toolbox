<script setup lang="ts">
import type { NETRIS2Parser } from '@w2a-iiot/parsers'
import * as v from 'valibot'
import type { FormError, TabsItem } from '@nuxt/ui'

type Props = {
  encodeDownlink: ReturnType<typeof NETRIS2Parser>['encodeDownlink']
}

type Channel = {
  min: number
  max: number
  unit: string
}

const props = defineProps<Props>()

const channels = ref<[Channel, Channel]>([
  {
    min: 4,
    max: 20,
    unit: 'mA',
  },
  {
    min: 4,
    max: 20,
    unit: 'mA',
  },
])

const DEFAULTS = {
  deadBand: { min: 0, max: 20 }, // percent
  threshold: { min: 0, max: 100 }, // percent
  slope: { min: 0, max: 50 }, // percent
  measureOffset: { min: -5, max: 5 }, // percent
}

// Helper: percent <-> real value conversion
function percentToReal(percent: number, span: number) {
  return span * (percent / 100)
}
function realToPercent(real: number, min: number, span: number) {
  return ((real - min) / span) * 100
}

// UI helpers for min/max/unit per field
function getFieldUnit(idx: 0 | 1) {
  return channels.value[idx].unit
}
function getFieldMinMax(field: string) {
  const [ch0, ch1] = channels.value
  const span0 = ch0.max - ch0.min
  const span1 = ch1.max - ch1.min

  // Thresholds: use min/max of channel directly
  if (field.startsWith('channel0_')) {
    if (
      field.endsWith('lowThreshold')
      || field.endsWith('highThreshold')
      || field.endsWith('lowThresholdWithDelay_value')
      || field.endsWith('highThresholdWithDelay_value')
    ) {
      // Thresholds: [ch0.min, ch0.max] (direct)
      return [ch0.min, ch0.max]
    }
    if (field.endsWith('deadBand')) {
      // DeadBand: [percentToReal(DEFAULTS.deadBand.min, ...), percentToReal(DEFAULTS.deadBand.max, ...)]
      return [
        percentToReal(DEFAULTS.deadBand.min, span0),
        percentToReal(DEFAULTS.deadBand.max, span0),
      ]
    }
    if (field.endsWith('risingSlope') || field.endsWith('fallingSlope')) {
      // Slope: [percentToReal(DEFAULTS.slope.min, ...), percentToReal(DEFAULTS.slope.max, ...)]
      return [
        percentToReal(DEFAULTS.slope.min, span0),
        percentToReal(DEFAULTS.slope.max, span0),
      ]
    }
    if (field.endsWith('measureOffset')) {
      // Offset: [percentToReal(-5, ...), percentToReal(5, ...)]
      return [
        percentToReal(DEFAULTS.measureOffset.min, span0),
        percentToReal(DEFAULTS.measureOffset.max, span0),
      ]
    }
    return [undefined, undefined]
  }
  if (field.startsWith('channel1_')) {
    if (
      field.endsWith('lowThreshold')
      || field.endsWith('highThreshold')
      || field.endsWith('lowThresholdWithDelay_value')
      || field.endsWith('highThresholdWithDelay_value')
    ) {
      // Thresholds: [ch1.min, ch1.max] (direct)
      return [ch1.min, ch1.max]
    }
    if (field.endsWith('deadBand')) {
      // DeadBand: [percentToReal(DEFAULTS.deadBand.min, ...), percentToReal(DEFAULTS.deadBand.max, ...)]
      return [
        percentToReal(DEFAULTS.deadBand.min, span1),
        percentToReal(DEFAULTS.deadBand.max, span1),
      ]
    }
    if (field.endsWith('risingSlope') || field.endsWith('fallingSlope')) {
      // Slope: [percentToReal(DEFAULTS.slope.min, ...), percentToReal(DEFAULTS.slope.max, ...)]
      return [
        percentToReal(DEFAULTS.slope.min, span1),
        percentToReal(DEFAULTS.slope.max, span1),
      ]
    }
    if (field.endsWith('measureOffset')) {
      // Offset: [percentToReal(-5, ...), percentToReal(5, ...)]
      return [
        percentToReal(DEFAULTS.measureOffset.min, span1),
        percentToReal(DEFAULTS.measureOffset.max, span1),
      ]
    }
    return [undefined, undefined]
  }
  return [undefined, undefined]
}

const _schema = computed(() => {
  const [ch0, ch1] = channels.value
  const span0 = ch0.max - ch0.min
  const span1 = ch1.max - ch1.min

  // Helper to get real value from percent
  const percentToReal0 = (percent: number) => percentToReal(percent, span0)
  const percentToReal1 = (percent: number) => percentToReal(percent, span1)

  return v.object({
    configurationId: v.optional(
      v.pipe(
        v.number('Configuration ID must be a number.'),
        v.integer('Configuration ID must be an integer.'),
        v.minValue(0, 'Minimum value is 0.'),
        v.maxValue(31, 'Maximum value is 31.'),
      ),
      1,
    ),
    spreadingFactor: v.optional(
      v.picklist(['SF7', 'SF8', 'SF9', 'SF10', 'SF11', 'SF12'], 'Select a valid spreading factor.'),
    ),

    // mainConfiguration fields
    measuringRateWhenNoAlarm: v.optional(
      v.pipe(
        v.number('Measuring rate must be a number.'),
        v.integer('Measuring rate must be an integer.'),
        v.minValue(60, 'Minimum measuring rate is 1 minute.'),
        v.maxValue(86400, 'Maximum measuring rate is 24 hours.'),
      ),
    ),
    measuringRateWhenAlarm: v.optional(
      v.pipe(
        v.number('Measuring rate  must be a number.'),
        v.integer('Measuring rate  must be an integer.'),
        v.minValue(60, 'Minimum measuring rate is 1 minute.'),
        v.maxValue(86400, 'Maximum measuring rate is 24 hours.'),
      ),
    ),
    publicationFactorWhenNoAlarm: v.optional(
      v.pipe(
        v.number('Publication Factor (No Alarm) must be a number.'),
        v.integer('Publication Factor (No Alarm) must be an integer.'),
        v.minValue(1, 'Minimum value is 1.'),
        v.maxValue(2880, 'Maximum value is 2880.'),
      ),
    ),
    publicationFactorWhenAlarm: v.optional(
      v.pipe(
        v.number('Publication Factor (Alarm) must be a number.'),
        v.integer('Publication Factor (Alarm) must be an integer.'),
        v.minValue(1, 'Minimum value is 1.'),
        v.maxValue(2880, 'Maximum value is 2880.'),
      ),
    ),

    // channel0 fields (real units)
    channel0_enabled: v.optional(
      v.boolean('Channel 0 Enabled must be a boolean.'),
    ),
    channel0_deadBand: v.optional(
      v.pipe(
        v.number(`Dead Band must be a number (${ch0.unit}).`),
        v.minValue(percentToReal0(DEFAULTS.deadBand.min), `Minimum value is ${percentToReal0(DEFAULTS.deadBand.min)} ${ch0.unit}.`),
        v.maxValue(percentToReal0(DEFAULTS.deadBand.max), `Maximum value is ${percentToReal0(DEFAULTS.deadBand.max)} ${ch0.unit}.`),
      ),
    ),
    channel0_alarms_lowThreshold: v.optional(
      v.pipe(
        v.number(`Low Threshold must be a number (${ch0.unit}).`),
        v.minValue(ch0.min, `Minimum value is ${ch0.min} ${ch0.unit}.`),
        v.maxValue(ch0.max, `Maximum value is ${ch0.max} ${ch0.unit}.`),
      ),
    ),
    channel0_alarms_highThreshold: v.optional(
      v.pipe(
        v.number(`High Threshold must be a number (${ch0.unit}).`),
        v.minValue(ch0.min, `Minimum value is ${ch0.min} ${ch0.unit}.`),
        v.maxValue(ch0.max, `Maximum value is ${ch0.max} ${ch0.unit}.`),
      ),
    ),
    channel0_alarms_lowThresholdWithDelay_value: v.optional(
      v.pipe(
        v.number(`Low Threshold With Delay (Value) must be a number (${ch0.unit}).`),
        v.minValue(ch0.min, `Minimum value is ${ch0.min} ${ch0.unit}.`),
        v.maxValue(ch0.max, `Maximum value is ${ch0.max} ${ch0.unit}.`),
      ),
    ),
    channel0_alarms_highThresholdWithDelay_value: v.optional(
      v.pipe(
        v.number(`High Threshold With Delay (Value) must be a number (${ch0.unit}).`),
        v.minValue(ch0.min, `Minimum value is ${ch0.min} ${ch0.unit}.`),
        v.maxValue(ch0.max, `Maximum value is ${ch0.max} ${ch0.unit}.`),
      ),
    ),
    channel0_alarms_lowThresholdWithDelay_delay: v.optional(
      v.pipe(
        v.number('Low Threshold With Delay (Delay) must be a number.'),
        v.integer('Low Threshold With Delay (Delay) must be an integer.'),
        v.minValue(0, 'Minimum value is 0.'),
        v.maxValue(65535, 'Maximum value is 65535.'),
      ),
    ),
    channel0_alarms_highThresholdWithDelay_delay: v.optional(
      v.pipe(
        v.number('High Threshold With Delay (Delay) must be a number.'),
        v.integer('High Threshold With Delay (Delay) must be an integer.'),
        v.minValue(0, 'Minimum value is 0.'),
        v.maxValue(65535, 'Maximum value is 65535.'),
      ),
    ),
    channel0_alarms_risingSlope: v.optional(
      v.pipe(
        v.number(`Rising Slope must be a number (${ch0.unit}).`),
        v.minValue(percentToReal0(DEFAULTS.slope.min), `Minimum value is ${percentToReal0(DEFAULTS.slope.min)} ${ch0.unit}.`),
        v.maxValue(percentToReal0(DEFAULTS.slope.max), `Maximum value is ${percentToReal0(DEFAULTS.slope.max)} ${ch0.unit}.`),
      ),
    ),
    channel0_alarms_fallingSlope: v.optional(
      v.pipe(
        v.number(`Falling Slope must be a number (${ch0.unit}).`),
        v.minValue(percentToReal0(DEFAULTS.slope.min), `Minimum value is ${percentToReal0(DEFAULTS.slope.min)} ${ch0.unit}.`),
        v.maxValue(percentToReal0(DEFAULTS.slope.max), `Maximum value is ${percentToReal0(DEFAULTS.slope.max)} ${ch0.unit}.`),
      ),
    ),
    channel0_startUpTime: v.optional(
      v.pipe(
        v.number('Start-up Time must be a number.'),
        v.minValue(0.1, 'Minimum value is 0.1 seconds.'),
        v.maxValue(15, 'Maximum value is 15 seconds.'),
      ),
    ),
    channel0_measureOffset: v.optional(
      v.pipe(
        v.number(`Measurement Offset must be a number (${ch0.unit}).`),
        v.minValue(percentToReal0(-5), `Minimum value is ${percentToReal0(-5)} ${ch0.unit}.`),
        v.maxValue(percentToReal0(5), `Maximum value is ${percentToReal0(5)} ${ch0.unit}.`),
      ),
    ),

    // channel1 fields (real units)
    channel1_enabled: v.optional(
      v.boolean('Channel 1 Enabled must be a boolean.'),
    ),
    channel1_deadBand: v.optional(
      v.pipe(
        v.number(`Dead Band must be a number (${ch1.unit}).`),
        v.minValue(percentToReal1(DEFAULTS.deadBand.min), `Minimum value is ${percentToReal1(DEFAULTS.deadBand.min)} ${ch1.unit}.`),
        v.maxValue(percentToReal1(DEFAULTS.deadBand.max), `Maximum value is ${percentToReal1(DEFAULTS.deadBand.max)} ${ch1.unit}.`),
      ),
    ),
    channel1_alarms_lowThreshold: v.optional(
      v.pipe(
        v.number(`Low Threshold must be a number (${ch1.unit}).`),
        v.minValue(ch1.min, `Minimum value is ${ch1.min} ${ch1.unit}.`),
        v.maxValue(ch1.max, `Maximum value is ${ch1.max} ${ch1.unit}.`),
      ),
    ),
    channel1_alarms_highThreshold: v.optional(
      v.pipe(
        v.number(`High Threshold must be a number (${ch1.unit}).`),
        v.minValue(ch1.min, `Minimum value is ${ch1.min} ${ch1.unit}.`),
        v.maxValue(ch1.max, `Maximum value is ${ch1.max} ${ch1.unit}.`),
      ),
    ),
    channel1_alarms_lowThresholdWithDelay_value: v.optional(
      v.pipe(
        v.number(`Low Threshold With Delay (Value) must be a number (${ch1.unit}).`),
        v.minValue(ch1.min, `Minimum value is ${ch1.min} ${ch1.unit}.`),
        v.maxValue(ch1.max, `Maximum value is ${ch1.max} ${ch1.unit}.`),
      ),
    ),
    channel1_alarms_highThresholdWithDelay_value: v.optional(
      v.pipe(
        v.number(`High Threshold With Delay (Value) must be a number (${ch1.unit}).`),
        v.minValue(ch1.min, `Minimum value is ${ch1.min} ${ch1.unit}.`),
        v.maxValue(ch1.max, `Maximum value is ${ch1.max} ${ch1.unit}.`),
      ),
    ),
    channel1_alarms_lowThresholdWithDelay_delay: v.optional(
      v.pipe(
        v.number('Low Threshold With Delay (Delay) must be a number.'),
        v.integer('Low Threshold With Delay (Delay) must be an integer.'),
        v.minValue(0, 'Minimum value is 0.'),
        v.maxValue(65535, 'Maximum value is 65535.'),
      ),
    ),
    channel1_alarms_highThresholdWithDelay_delay: v.optional(
      v.pipe(
        v.number('High Threshold With Delay (Delay) must be a number.'),
        v.integer('High Threshold With Delay (Delay) must be an integer.'),
        v.minValue(0, 'Minimum value is 0.'),
        v.maxValue(65535, 'Maximum value is 65535.'),
      ),
    ),
    channel1_alarms_risingSlope: v.optional(
      v.pipe(
        v.number(`Rising Slope must be a number (${ch1.unit}).`),
        v.minValue(percentToReal1(DEFAULTS.slope.min), `Minimum value is ${percentToReal1(DEFAULTS.slope.min)} ${ch1.unit}.`),
        v.maxValue(percentToReal1(DEFAULTS.slope.max), `Maximum value is ${percentToReal1(DEFAULTS.slope.max)} ${ch1.unit}.`),
      ),
    ),
    channel1_alarms_fallingSlope: v.optional(
      v.pipe(
        v.number(`Falling Slope must be a number (${ch1.unit}).`),
        v.minValue(percentToReal1(DEFAULTS.slope.min), `Minimum value is ${percentToReal1(DEFAULTS.slope.min)} ${ch1.unit}.`),
        v.maxValue(percentToReal1(DEFAULTS.slope.max), `Maximum value is ${percentToReal1(DEFAULTS.slope.max)} ${ch1.unit}.`),
      ),
    ),
    channel1_startUpTime: v.optional(
      v.pipe(
        v.number('Start-up Time must be a number.'),
        v.minValue(0.1, 'Minimum value is 0.1 seconds.'),
        v.maxValue(15, 'Maximum value is 15 seconds.'),
      ),
    ),
    channel1_measureOffset: v.optional(
      v.pipe(
        v.number(`Measurement Offset must be a number (${ch1.unit}).`),
        v.minValue(percentToReal1(-5), `Minimum value is ${percentToReal1(-5)} ${ch1.unit}.`),
        v.maxValue(percentToReal1(5), `Maximum value is ${percentToReal1(5)} ${ch1.unit}.`),
      ),
    ),
  })
})

type EncodingInput = Parameters<ReturnType<typeof NETRIS2Parser>['encodeDownlink']>[0]

type State = v.InferInput<(typeof _schema)['value']>

const configurationQuery = useRouteQuery('configuration')

function getInitialValue(skipQuery = false): State {
  const doesQueryHaveValue = typeof configurationQuery.value === 'string'
  if (!doesQueryHaveValue || skipQuery) {
    return {
      configurationId: 1,
    }
  }
  try {
    const decodedBase64 = atob(configurationQuery.value as string)
    const parsedJson = JSON.parse(decodedBase64)
    return v.parse(_schema.value, parsedJson)
  }
  catch (error) {
    console.error('Failed to parse configuration:', error)
    return {
      configurationId: 1,
    }
  }
}

const state = ref(getInitialValue())

watch(state, (newState) => {
  const encoded = btoa(JSON.stringify(newState))
  configurationQuery.value = encoded
}, {
  deep: true,
})

// Helper: check if any channel fields (except enabled) are set
function isAnyChannelFieldSet(flat: State, prefix: 'channel0' | 'channel1') {
  const fields = [
    'deadBand',
    'alarms_lowThreshold',
    'alarms_highThreshold',
    'alarms_lowThresholdWithDelay_value',
    'alarms_lowThresholdWithDelay_delay',
    'alarms_highThresholdWithDelay_value',
    'alarms_highThresholdWithDelay_delay',
    'alarms_risingSlope',
    'alarms_fallingSlope',
    'startUpTime',
    'measureOffset',
  ]
  return fields.some(f => flat[`${prefix}_${f}` as keyof State] !== undefined)
}

// Function to format flat state into nested structure for encodeDownlink
function formatForEncodeDownlink(flat: State): EncodingInput {
  const [ch0, ch1] = channels.value
  const span0 = ch0.max - ch0.min
  const span1 = ch1.max - ch1.min

  // Helper: convert real value to percent for channel 0/1 for span-based fields
  const toPercent0 = (real: number) => realToPercent(real, 0, span0)
  const toPercent1 = (real: number) => realToPercent(real, 0, span1)
  // Helper: convert real value to percent for offset (which is -5..5% of span)
  const toPercentOffset0 = (real: number) => realToPercent(real, 0, span0)
  const toPercentOffset1 = (real: number) => realToPercent(real, 0, span1)
  // Helper: convert real value to percent for threshold fields (min/max mapping)
  const toPercentThreshold0 = (real: number) => realToPercent(real, ch0.min, span0)
  const toPercentThreshold1 = (real: number) => realToPercent(real, ch1.min, span1)

  // Helper to build alarms object for a channel
  function buildAlarms(prefix: 'channel0' | 'channel1') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const alarms: any = {}
    const isCh0 = prefix === 'channel0'
    const toPercent = isCh0 ? toPercent0 : toPercent1
    const toPercentThreshold = isCh0 ? toPercentThreshold0 : toPercentThreshold1

    // Thresholds: convert from real value to percent of min/max
    if (flat[`${prefix}_alarms_lowThreshold`] !== undefined)
      alarms.lowThreshold = toPercentThreshold(flat[`${prefix}_alarms_lowThreshold`] as number)
    if (flat[`${prefix}_alarms_highThreshold`] !== undefined)
      alarms.highThreshold = toPercentThreshold(flat[`${prefix}_alarms_highThreshold`] as number)
    if (
      flat[`${prefix}_alarms_lowThresholdWithDelay_value`] !== undefined
      || flat[`${prefix}_alarms_lowThresholdWithDelay_delay`] !== undefined
    ) {
      alarms.lowThresholdWithDelay = {}
      if (flat[`${prefix}_alarms_lowThresholdWithDelay_value`] !== undefined)
        alarms.lowThresholdWithDelay.value = toPercentThreshold(flat[`${prefix}_alarms_lowThresholdWithDelay_value`] as number)
      if (flat[`${prefix}_alarms_lowThresholdWithDelay_delay`] !== undefined)
        alarms.lowThresholdWithDelay.delay = flat[`${prefix}_alarms_lowThresholdWithDelay_delay`]
    }
    if (
      flat[`${prefix}_alarms_highThresholdWithDelay_value`] !== undefined
      || flat[`${prefix}_alarms_highThresholdWithDelay_delay`] !== undefined
    ) {
      alarms.highThresholdWithDelay = {}
      if (flat[`${prefix}_alarms_highThresholdWithDelay_value`] !== undefined)
        alarms.highThresholdWithDelay.value = toPercentThreshold(flat[`${prefix}_alarms_highThresholdWithDelay_value`] as number)
      if (flat[`${prefix}_alarms_highThresholdWithDelay_delay`] !== undefined)
        alarms.highThresholdWithDelay.delay = flat[`${prefix}_alarms_highThresholdWithDelay_delay`]
    }
    // Slope: convert from real value to percent of span (span always starts at 0)
    if (flat[`${prefix}_alarms_risingSlope`] !== undefined)
      alarms.risingSlope = toPercent(flat[`${prefix}_alarms_risingSlope`] as number)
    if (flat[`${prefix}_alarms_fallingSlope`] !== undefined)
      alarms.fallingSlope = toPercent(flat[`${prefix}_alarms_fallingSlope`] as number)
    return Object.keys(alarms).length > 0 ? alarms : undefined
  }

  // Helper to build channel config
  function buildChannel(prefix: 'channel0' | 'channel1') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel: any = {}
    const isCh0 = prefix === 'channel0'
    const toPercent = isCh0 ? toPercent0 : toPercent1
    const toPercentOffset = isCh0 ? toPercentOffset0 : toPercentOffset1

    // DeadBand: convert from real value to percent of span (span always starts at 0)
    if (flat[`${prefix}_deadBand`] !== undefined)
      channel.deadBand = toPercent(flat[`${prefix}_deadBand`] as number)
    const alarms = buildAlarms(prefix)
    if (alarms) channel.alarms = alarms
    // Add startUpTime if set (no conversion needed)
    if (flat[`${prefix}_startUpTime`] !== undefined)
      channel.startUpTime = flat[`${prefix}_startUpTime`]
    // measureOffset: convert from real value to percent of span (span always starts at 0)
    if (flat[`${prefix}_measureOffset`] !== undefined)
      channel.measureOffset = toPercentOffset(flat[`${prefix}_measureOffset`] as number)
    return Object.keys(channel).length > 0 ? channel : undefined
  }

  // Build mainConfiguration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mainConfiguration: any = {}
  if (flat.measuringRateWhenNoAlarm !== undefined)
    mainConfiguration.measuringRateWhenNoAlarm = flat.measuringRateWhenNoAlarm
  if (flat.measuringRateWhenAlarm !== undefined)
    mainConfiguration.measuringRateWhenAlarm = flat.measuringRateWhenAlarm
  if (flat.publicationFactorWhenNoAlarm !== undefined)
    mainConfiguration.publicationFactorWhenNoAlarm = flat.publicationFactorWhenNoAlarm
  if (flat.publicationFactorWhenAlarm !== undefined)
    mainConfiguration.publicationFactorWhenAlarm = flat.publicationFactorWhenAlarm

  // Compose channel config based on enabled/fields
  function buildChannelConfig(prefix: 'channel0' | 'channel1') {
    const enabled = flat[`${prefix}_enabled`]
    if (!enabled) {
      // Disabled: use { disable: true }
      return false
    }
    if (!isAnyChannelFieldSet(flat, prefix)) {
      // Enabled, but no fields set: use true
      return true
    }
    // Enabled, fields set: build object
    return buildChannel(prefix)
  }

  // Compose final nested object
  return {
    deviceAction: 'downlinkConfiguration',
    configurationId: flat.configurationId,
    spreadingFactor: flat.spreadingFactor,
    configuration: {
      mainConfiguration: Object.keys(mainConfiguration).length > 0 ? mainConfiguration : undefined,
      channel0: buildChannelConfig('channel0'),
      channel1: buildChannelConfig('channel1'),
    },
  }
}

const tabItems = [
  { label: 'Main', value: 'main', slot: 'main' } as const,
  { label: 'Channel 0', value: 'channel0', slot: 'channel0' } as const,
  { label: 'Channel 1', value: 'channel1', slot: 'channel1' } as const,
] satisfies TabsItem[]

const tabState = ref('main')

function validate(): FormError[] {
  const result = v.safeParse(_schema.value, state.value)
  const issues: FormError[] = []
  if (!result.success) {
    return result.issues?.map(issue => ({
      name: issue.path?.map(item => typeof item === 'object' ? item.key : item).join('.') || '',
      message: issue.message,
    })) ?? []
  }

  // All-or-none logic for main configuration fields
  const mainFields = [
    'measuringRateWhenNoAlarm',
    'publicationFactorWhenNoAlarm',
    'measuringRateWhenAlarm',
    'publicationFactorWhenAlarm',
  ] as (keyof State)[]

  const filled = mainFields.map(f => state.value[f] !== undefined)
  const anyFilled = filled.some(Boolean)
  const allFilled = filled.every(Boolean)
  if (anyFilled && !allFilled) {
    mainFields.forEach((f, idx) => {
      if (!filled[idx]) {
        issues.push({
          name: f,
          message: 'All 4 main configuration fields must be set if any is set.',
        })
      }
    })
  }

  // Check transmission interval for both cases if all relevant fields are set
  if (allFilled) {
    const noAlarm = state.value.measuringRateWhenNoAlarm! * state.value.publicationFactorWhenNoAlarm!
    if (noAlarm > 172800) {
      const time = convertSecondsToHMS(noAlarm)
      const msg = `The transmission interval must not exceed 48 hours. Currently is ${time.hours} hours, ${time.minutes} minutes, and ${time.seconds} seconds.`
      issues.push({ name: 'measuringRateWhenNoAlarm', message: msg })
      issues.push({ name: 'publicationFactorWhenNoAlarm', message: msg })
    }
    const alarm = state.value.measuringRateWhenAlarm! * state.value.publicationFactorWhenAlarm!
    if (alarm > 172800) {
      const time = convertSecondsToHMS(alarm)
      const msg = `The transmission interval must not exceed 48 hours. Currently is ${time.hours} hours, ${time.minutes} minutes, and ${time.seconds} seconds.`
      issues.push({ name: 'measuringRateWhenAlarm', message: msg })
      issues.push({ name: 'publicationFactorWhenAlarm', message: msg })
    }
  }

  // All-or-none logic for threshold-with-delay fields for both channels
  const delayFields = [
    {
      prefix: 'channel0',
      pairs: [
        ['channel0_alarms_lowThresholdWithDelay_value', 'channel0_alarms_lowThresholdWithDelay_delay'],
        ['channel0_alarms_highThresholdWithDelay_value', 'channel0_alarms_highThresholdWithDelay_delay'],
      ],
    },
    {
      prefix: 'channel1',
      pairs: [
        ['channel1_alarms_lowThresholdWithDelay_value', 'channel1_alarms_lowThresholdWithDelay_delay'],
        ['channel1_alarms_highThresholdWithDelay_value', 'channel1_alarms_highThresholdWithDelay_delay'],
      ],
    },
  ]

  for (const { pairs } of delayFields) {
    for (const [valueKey, delayKey] of pairs) {
      const valueSet = state.value[valueKey as keyof State] !== undefined
      const delaySet = state.value[delayKey as keyof State] !== undefined
      if ((valueSet || delaySet) && !(valueSet && delaySet)) {
        if (!valueSet) {
          issues.push({
            name: valueKey,
            message: 'Both value and delay must be set for threshold with delay.',
          })
        }
        if (!delaySet) {
          issues.push({
            name: delayKey,
            message: 'Both value and delay must be set for threshold with delay.',
          })
        }
      }
      // Additional: delay must be a multiple of both measurement periods if all are set
      if (valueSet && delaySet) {
        const delay = state.value[delayKey as keyof State]
        const mrNoAlarm = state.value.measuringRateWhenNoAlarm
        const mrAlarm = state.value.measuringRateWhenAlarm
        if (
          typeof delay === 'number'
          && typeof mrNoAlarm === 'number'
          && typeof mrAlarm === 'number'
        ) {
          // Must be multiple of both measurement rates
          if (
            delay % mrNoAlarm !== 0
            || delay % mrAlarm !== 0
          ) {
            issues.push({
              name: delayKey,
              message: 'Delay must be a multiple of both measurement periods (with and without alarm).',
            })
          }
        }
      }
    }
  }

  // Channel validation: only require deadBand if another property is set
  const channelPrefixes = ['channel0', 'channel1']
  const channelFields = [
    // do not include 'enabled'
    'alarms_lowThreshold',
    'alarms_highThreshold',
    'alarms_lowThresholdWithDelay_value',
    'alarms_lowThresholdWithDelay_delay',
    'alarms_highThresholdWithDelay_value',
    'alarms_highThresholdWithDelay_delay',
    'alarms_risingSlope',
    'alarms_fallingSlope',
    'startUpTime',
    'measureOffset',
    'deadBand', // include deadBand for checking if it's the only one set
  ]
  for (const prefix of channelPrefixes) {
    const enabledKey = `${prefix}_enabled` as keyof State
    if (!state.value[enabledKey]) continue // skip validation if channel disabled

    // Check if any channel property except enabled and deadBand is set
    const anyOtherSet = channelFields
      .filter(f => f !== 'deadBand')
      .some(f => state.value[`${prefix}_${f}` as keyof State] !== undefined)

    const deadBandKey = `${prefix}_deadBand` as keyof State

    // Only require deadBand if another property is set
    if (anyOtherSet && state.value[deadBandKey] === undefined) {
      issues.push({
        name: deadBandKey,
        message: 'Dead Band is required if any channel field is set.',
      })
    }
    // If channel is enabled and no other fields are set (except enabled), it's valid (do nothing)
    // If only deadBand is set, that's also valid (do nothing)
  }

  console.log({ issues })

  return issues
}

function encode(input: EncodingInput) {
  const res = props.encodeDownlink(input)
  if (res.success) {
    frames.value = res.data.frames.map(frame => intArrayToHex(frame))
    errors.value = undefined
  }
  else {
    errors.value = res.errors
    frames.value = undefined
  }
}

function encodeFactoryReset() {
  encode({
    deviceAction: 'resetToFactory',
  })
}

function encodeResetBatteryIndicator() {
  encode({
    deviceAction: 'resetBatteryIndicator',
    configurationId: state.value.configurationId,
  })
}

const form = useTemplateRef('form')

onMounted(() => {
  form.value?.submit()
})

const toast = useToast()

const errors = shallowRef<string[] | undefined>(undefined)
const frames = shallowRef<string[] | undefined>(undefined)

function submit() {
  const formatted = formatForEncodeDownlink(state.value)
  console.log({ formatted })
  const res = props.encodeDownlink(formatted)

  if (res.success) {
    frames.value = res.data.frames.map(frame => intArrayToHex(frame))
    errors.value = undefined
  }
  else {
    errors.value = res.errors
    frames.value = undefined
  }
}

function intArrayToHex(arr: number[]): string {
  const hex = arr.map(num => num.toString(16).padStart(2, '0')).join('')
  return `0x${hex}`
}
</script>

<template>
  <UForm
    ref="form"
    class="h-full w-full"
    :validate="validate"
    :state="state"
    @submit="submit()"
    @error="toast.add({
      title: 'Validation Error',
      description: 'Please fix the errors in the form.',
      color: 'error',
    })"
  >
    <TabLayout>
      <div class="flex flex-col grow w-full h-full gap-2">
        <div class="flex flex-col gap-2 grow">
          <Fieldset title="Quick actions">
            <UButton
              variant="solid"
              class="w-fit"
              @click="() => {
                state = getInitialValue(true);
                form?.clear()
                errors = undefined
                frames = undefined
              }"
            >
              Reset
            </UButton>
          </Fieldset>
          <Fieldset title="Encoder settings">
            <div class="flex gap-1 md:gap-2 flex-col md:flex-row flex-wrap">
              <FormField
                label="Configuration ID"
                name="configurationId"
                tooltip="Configuration identifier. Used to match configuration commands and responses. Should be incremented for each new configuration sent."
              >
                <UInputNumber
                  v-model="state.configurationId"
                  class="w-60"
                  :min="0"
                  :max="31"
                />
              </FormField>
              <FormField
                label="Spreading Factor"
                name="spreadingFactor"
                tooltip="LoRaWAN spreading factor. Influences maximum frame size and transmission range. Lower SF = higher data rate, shorter range."
              >
                <USelect
                  v-model="state.spreadingFactor"
                  class="w-60"
                  :items="['SF7', 'SF8', 'SF9', 'SF10', 'SF11', 'SF12']"
                />
              </FormField>
            </div>
          </Fieldset>
          <Fieldset
            title="Configuration"
            class="w-full"
          >
            <div class="flex flex-col gap-2 mt-2">
              <div class="w-full hidden justify-between lg:flex">
                <div class="flex gap-2">
                  <UButton
                    color="error"
                    class="w-fit"
                    @click="encodeFactoryReset"
                  >
                    Encode factory reset
                  </UButton>
                  <UButton
                    color="warning"
                    class="w-fit"
                    @click="encodeResetBatteryIndicator"
                  >
                    Encode reset battery indicator
                  </UButton>
                </div>
                <UButton
                  variant="solid"
                  class="w-fit"
                  type="submit"
                >
                  Encode Downlink
                </UButton>
              </div>
              <UTabs
                v-model="tabState"
                :items="tabItems"
                class="w-full"
              >
                <template #main>
                  <EncoderFormLayout>
                    <FormFieldset
                      title="Case: No Alarm"
                      class="w-full"
                      tooltip="Main configuration: Measurement period and transmission multiplier when no alarm is active. Transmission interval = measurement period × multiplier. Must be ≤ 48 hours."
                    >
                      <FormField
                        class="w-full"
                        label="Measuring Rate"
                        name="measuringRateWhenNoAlarm"
                        tooltip="Measurement period when no alarm is active. Range: 0:1:0 – 48:0:0."
                        hint="[0:1:0...48:0:0]"
                      >
                        <DurationInput
                          v-model="state.measuringRateWhenNoAlarm"
                          class="w-full"
                          :min="60"
                          :max="86400"
                        />
                      </FormField>
                      <FormField
                        label="Publication Factor"
                        name="publicationFactorWhenNoAlarm"
                        tooltip="Transmission multiplier when no alarm is active. Transmission interval = measurement period × multiplier. Range: 1–2880."
                        hint="[1...2880]"
                      >
                        <UInputNumber
                          v-model="state.publicationFactorWhenNoAlarm"
                          class="w-full"
                          :min="1"
                          :max="2880"
                        />
                      </FormField>
                      <UAlert
                        v-if="state.measuringRateWhenNoAlarm && state.publicationFactorWhenNoAlarm"
                        class="mt-4"
                        color="info"
                        variant="subtle"
                        title="Transmission Interval"
                        :description="`The transmission interval is calculated as the product of the measuring rate and publication factor. The device will transmit every ${convertSecondsToHMS(state.measuringRateWhenNoAlarm * state.publicationFactorWhenNoAlarm).hours} hours, ${convertSecondsToHMS(state.measuringRateWhenNoAlarm * state.publicationFactorWhenNoAlarm).minutes} minutes, and ${convertSecondsToHMS(state.measuringRateWhenNoAlarm * state.publicationFactorWhenNoAlarm).seconds} seconds.`"
                      />
                    </FormFieldset>
                    <FormFieldset
                      title="Case: Alarm"
                      class="w-full"
                      tooltip="Main configuration: Measurement period and transmission multiplier when at least one alarm is active. Transmission interval = measurement period × multiplier. Must be ≤ 48 hours."
                    >
                      <FormField
                        label="Measuring Rate"
                        name="measuringRateWhenAlarm"
                        tooltip="Measurement period when an alarm is active. Range: 0:1:0 – 48:0:0."
                        hint="[0:1:0...48:0:0]"
                      >
                        <DurationInput
                          v-model="state.measuringRateWhenAlarm"
                          :min="60"
                          :max="86400"
                          class="w-full"
                        />
                      </FormField>
                      <FormField
                        label="Publication Factor"
                        name="publicationFactorWhenAlarm"
                        tooltip="Transmission multiplier when an alarm is active. Transmission interval = measurement period × multiplier. Range: 1–2880."
                        hint="[1...2880]"
                      >
                        <UInputNumber
                          v-model="state.publicationFactorWhenAlarm"
                          class="w-full"
                          :min="1"
                          :max="2880"
                        />
                      </FormField>
                      <UAlert
                        v-if="state.measuringRateWhenAlarm && state.publicationFactorWhenAlarm"
                        class="mt-4"
                        color="info"
                        variant="subtle"
                        title="Transmission Interval"
                        :description="`The transmission interval is calculated as the product of the measuring rate and publication factor. The device will transmit every ${convertSecondsToHMS(state.measuringRateWhenAlarm * state.publicationFactorWhenAlarm).hours} hours, ${convertSecondsToHMS(state.measuringRateWhenAlarm * state.publicationFactorWhenAlarm).minutes} minutes, and ${convertSecondsToHMS(state.measuringRateWhenAlarm * state.publicationFactorWhenAlarm).seconds} seconds.`"
                      />
                    </FormFieldset>
                  </EncoderFormLayout>
                </template>
                <template #channel0>
                  <EncoderFormLayout>
                    <UCheckbox
                      v-model="state.channel0_enabled"
                      label="Enable Channel 0"
                      description="Enable or disable Channel 0. When disabled, all channel 0 settings are ignored."
                      class="mb-2"
                    />
                    <FormFieldset
                      title="Dead Band"
                      class="w-full"
                      :tooltip="`Dead band for channel 0. Used for all non-slope alarms. Range: ${getFieldMinMax('channel0_deadBand')[0]}–${getFieldMinMax('channel0_deadBand')[1]} ${getFieldUnit(0)} (corresponds to 0–20% of span).`"
                    >
                      <FormField
                        label="Dead Band"
                        name="channel0_deadBand"
                        :hint="`[${getFieldMinMax('channel0_deadBand')[0]}...${getFieldMinMax('channel0_deadBand')[1]}]${getFieldUnit(0)}`"
                      >
                        <UInputNumber
                          v-model="state.channel0_deadBand"
                          class="w-full"
                          :min="getFieldMinMax('channel0_deadBand')[0]"
                          :max="getFieldMinMax('channel0_deadBand')[1]"
                          :step="0.01"
                          :disabled="!state.channel0_enabled"
                          :suffix="getFieldUnit(0)"
                        />
                      </FormField>
                    </FormFieldset>
                    <FormFieldset
                      title="Thresholds"
                      class="w-full"
                      :tooltip="`Process alarm configuration for channel 0. Set low/high threshold alarms. Range: ${getFieldMinMax('channel0_alarms_lowThreshold')[0]}–${getFieldMinMax('channel0_alarms_lowThreshold')[1]} ${getFieldUnit(0)} (corresponds to 0–100% of span).`"
                    >
                      <FormField
                        label="Low Threshold"
                        name="channel0_alarms_lowThreshold"
                        :hint="`[${getFieldMinMax('channel0_alarms_lowThreshold')[0]}...${getFieldMinMax('channel0_alarms_lowThreshold')[1]}]${getFieldUnit(0)}`"
                      >
                        <template #tooltip>
                          Triggers if measurement falls below threshold minus dead band.
                          <NuxtImg
                            class="mt-2"
                            src="/imgs/TULIP1_2/low_threshold_alarm.png"
                          />
                        </template>
                        <UInputNumber
                          v-model="state.channel0_alarms_lowThreshold"
                          class="w-full"
                          :min="getFieldMinMax('channel0_alarms_lowThreshold')[0]"
                          :max="getFieldMinMax('channel0_alarms_lowThreshold')[1]"
                          :step="0.01"
                          :disabled="!state.channel0_enabled"
                          :suffix="getFieldUnit(0)"
                        />
                      </FormField>
                      <FormField
                        label="High Threshold"
                        name="channel0_alarms_highThreshold"
                        :hint="`[${getFieldMinMax('channel0_alarms_highThreshold')[0]}...${getFieldMinMax('channel0_alarms_highThreshold')[1]}]${getFieldUnit(0)}`"
                      >
                        <template #tooltip>
                          Triggers if measurement rises above threshold plus dead band.
                          <NuxtImg
                            class="mt-2"
                            src="/imgs/TULIP1_2/high_threshold_alarm.png"
                          />
                        </template>
                        <UInputNumber
                          v-model="state.channel0_alarms_highThreshold"
                          class="w-full"
                          :min="getFieldMinMax('channel0_alarms_highThreshold')[0]"
                          :max="getFieldMinMax('channel0_alarms_highThreshold')[1]"
                          :step="0.01"
                          :disabled="!state.channel0_enabled"
                          :suffix="getFieldUnit(0)"
                        />
                      </FormField>
                    </FormFieldset>
                    <FormFieldset
                      title="Low Threshold With Delay"
                      class="w-full"
                      :tooltip="`Delayed low threshold alarm for channel 0. Value range: ${getFieldMinMax('channel0_alarms_lowThresholdWithDelay_value')[0]}–${getFieldMinMax('channel0_alarms_lowThresholdWithDelay_value')[1]} ${getFieldUnit(0)} (corresponds to 0–100% of span). Delay is in seconds and must be a multiple of both measurement periods (with and without alarm).`"
                    >
                      <FormField
                        label="Value"
                        name="channel0_alarms_lowThresholdWithDelay_value"
                        :hint="`[${getFieldMinMax('channel0_alarms_lowThresholdWithDelay_value')[0]}...${getFieldMinMax('channel0_alarms_lowThresholdWithDelay_value')[1]}]${getFieldUnit(0)}`"
                      >
                        <template #tooltip>
                          Triggers if measurement falls below threshold for the specified delay time.<br>
                          <b>Note:</b> Delay must be a multiple of both measurement periods (with and without alarm).
                          <NuxtImg
                            class="mt-2"
                            src="/imgs/TULIP1_2/low_threshold_alarm_with_delay.png"
                          />
                        </template>
                        <UInputNumber
                          v-model="state.channel0_alarms_lowThresholdWithDelay_value"
                          class="w-full"
                          :min="getFieldMinMax('channel0_alarms_lowThresholdWithDelay_value')[0]"
                          :max="getFieldMinMax('channel0_alarms_lowThresholdWithDelay_value')[1]"
                          :step="0.01"
                          :disabled="!state.channel0_enabled"
                          :suffix="getFieldUnit(0)"
                        />
                      </FormField>
                      <FormField
                        label="Delay"
                        name="channel0_alarms_lowThresholdWithDelay_delay"
                        :hint="`[0:0:0...18:12:15]`"
                      >
                        <template #tooltip>
                          Delay for delayed low alarm. Enter as hours:minutes:seconds. Maximum is 18:12:15 (65535 seconds).<br>
                          <b>Note:</b> Delay must be a multiple of both measurement periods (with and without alarm).
                          <NuxtImg
                            class="mt-2"
                            src="/imgs/TULIP1_2/low_threshold_alarm_with_delay.png"
                          />
                        </template>
                        <DurationInput
                          v-model="state.channel0_alarms_lowThresholdWithDelay_delay"
                          class="w-full"
                          :min="0"
                          :max="65535"
                          :disabled="!state.channel0_enabled"
                        />
                      </FormField>
                    </FormFieldset>
                    <FormFieldset
                      title="High Threshold With Delay"
                      class="w-full"
                      :tooltip="`Delayed high threshold alarm for channel 0. Value range: ${getFieldMinMax('channel0_alarms_highThresholdWithDelay_value')[0]}–${getFieldMinMax('channel0_alarms_highThresholdWithDelay_value')[1]} ${getFieldUnit(0)} (corresponds to 0–100% of span). Delay is in seconds and must be a multiple of both measurement periods (with and without alarm).`"
                    >
                      <FormField
                        label="Value"
                        name="channel0_alarms_highThresholdWithDelay_value"
                        :hint="`[${getFieldMinMax('channel0_alarms_highThresholdWithDelay_value')[0]}...${getFieldMinMax('channel0_alarms_highThresholdWithDelay_value')[1]}]${getFieldUnit(0)}`"
                      >
                        <template #tooltip>
                          Triggers if measurement rises above threshold for the specified delay time.<br>
                          <b>Note:</b> Delay must be a multiple of both measurement periods (with and without alarm).
                          <NuxtImg
                            class="mt-2"
                            src="/imgs/TULIP1_2/high_threshold_alarm_with_delay.png"
                          />
                        </template>
                        <UInputNumber
                          v-model="state.channel0_alarms_highThresholdWithDelay_value"
                          class="w-full"
                          :min="getFieldMinMax('channel0_alarms_highThresholdWithDelay_value')[0]"
                          :max="getFieldMinMax('channel0_alarms_highThresholdWithDelay_value')[1]"
                          :step="0.01"
                          :disabled="!state.channel0_enabled"
                          :suffix="getFieldUnit(0)"
                        />
                      </FormField>
                      <FormField
                        label="Delay"
                        name="channel0_alarms_highThresholdWithDelay_delay"
                        :hint="`[0:0:0...18:12:15]`"
                      >
                        <template #tooltip>
                          Delay for delayed high alarm. Enter as hours:minutes:seconds. Maximum is 18:12:15 (65535 seconds).<br>
                          <b>Note:</b> Delay must be a multiple of both measurement periods (with and without alarm).
                          <NuxtImg
                            class="mt-2"
                            src="/imgs/TULIP1_2/high_threshold_alarm_with_delay.png"
                          />
                        </template>
                        <DurationInput
                          v-model="state.channel0_alarms_highThresholdWithDelay_delay"
                          class="w-full"
                          :min="0"
                          :max="65535"
                          :disabled="!state.channel0_enabled"
                        />
                      </FormField>
                    </FormFieldset>
                    <FormFieldset
                      title="Slope Alarms"
                      class="w-full"
                      :tooltip="`Slope alarms for channel 0. Rising/falling slope range: ${getFieldMinMax('channel0_alarms_risingSlope')[0]}–${getFieldMinMax('channel0_alarms_risingSlope')[1]} ${getFieldUnit(0)} per minute (corresponds to 0–50% of span).`"
                    >
                      <FormField
                        label="Rising Slope"
                        name="channel0_alarms_risingSlope"
                        :hint="`[${getFieldMinMax('channel0_alarms_risingSlope')[0]}...${getFieldMinMax('channel0_alarms_risingSlope')[1]}]${getFieldUnit(0)}`"
                      >
                        <template #tooltip>
                          Triggers if value rises faster than this slope.
                          <NuxtImg
                            class="mt-2"
                            src="/imgs/TULIP1_2/rising_slope_alarm.png"
                          />
                        </template>
                        <UInputNumber
                          v-model="state.channel0_alarms_risingSlope"
                          class="w-full"
                          :min="getFieldMinMax('channel0_alarms_risingSlope')[0]"
                          :max="getFieldMinMax('channel0_alarms_risingSlope')[1]"
                          :step="0.01"
                          :disabled="!state.channel0_enabled"
                          :suffix="getFieldUnit(0)"
                        />
                      </FormField>
                      <FormField
                        label="Falling Slope"
                        name="channel0_alarms_fallingSlope"
                        :hint="`[${getFieldMinMax('channel0_alarms_fallingSlope')[0]}...${getFieldMinMax('channel0_alarms_fallingSlope')[1]}]${getFieldUnit(0)}`"
                      >
                        <template #tooltip>
                          Triggers if value falls faster than this slope.
                          <NuxtImg
                            class="mt-2"
                            src="/imgs/TULIP1_2/falling_slope_alarm.png"
                          />
                        </template>
                        <UInputNumber
                          v-model="state.channel0_alarms_fallingSlope"
                          class="w-full"
                          :min="getFieldMinMax('channel0_alarms_fallingSlope')[0]"
                          :max="getFieldMinMax('channel0_alarms_fallingSlope')[1]"
                          :step="0.01"
                          :disabled="!state.channel0_enabled"
                          :suffix="getFieldUnit(0)"
                        />
                      </FormField>
                    </FormFieldset>
                    <FormFieldset
                      title="Measurement Offset"
                      class="w-full"
                      :tooltip="`Measurement offset for channel 0. Range: ${getFieldMinMax('channel0_measureOffset')[0]}–${getFieldMinMax('channel0_measureOffset')[1]} ${getFieldUnit(0)} (corresponds to -5 to 5% of span). This value is added to all measurements for calibration.`"
                    >
                      <FormField
                        label="Measurement Offset"
                        name="channel0_measureOffset"
                        :hint="`[${getFieldMinMax('channel0_measureOffset')[0]}...${getFieldMinMax('channel0_measureOffset')[1]}]${getFieldUnit(0)}`"
                      >
                        <template #tooltip>
                          The measurement offset is added to all readings for calibration purposes.
                        </template>
                        <UInputNumber
                          v-model="state.channel0_measureOffset"
                          class="w-full"
                          :min="getFieldMinMax('channel0_measureOffset')[0]"
                          :max="getFieldMinMax('channel0_measureOffset')[1]"
                          :step="0.01"
                          :disabled="!state.channel0_enabled"
                          :suffix="getFieldUnit(0)"
                        />
                      </FormField>
                    </FormFieldset>
                    <FormFieldset
                      title="Start-up Time"
                      class="w-full"
                      tooltip="Start-up time for channel 0. Time in seconds (0.1–15). Only the first decimal place is used. This is the time the device waits after power-up before starting measurements."
                    >
                      <FormField
                        label="Start-up Time"
                        name="channel0_startUpTime"
                        hint="[0.1...15]s"
                      >
                        <template #tooltip>
                          The start-up time is the delay after power-up before the device starts measuring. Useful for sensor stabilization.<br>
                        </template>
                        <UInputNumber
                          v-model="state.channel0_startUpTime"
                          class="w-full"
                          :min="0.1"
                          :max="15"
                          :step="0.1"
                          :disabled="!state.channel0_enabled"
                        />
                      </FormField>
                    </FormFieldset>
                  </EncoderFormLayout>
                </template>
                <template #channel1>
                  <EncoderFormLayout>
                    <UCheckbox
                      v-model="state.channel1_enabled"
                      label="Enable Channel 1"
                      description="Enable or disable Channel 1. When disabled, all channel 1 settings are ignored."
                      class="mb-2"
                    />
                    <FormFieldset
                      title="Dead Band"
                      class="w-full"
                      :tooltip="`Dead band for channel 1. Used for all non-slope alarms. Range: ${getFieldMinMax('channel1_deadBand')[0]}–${getFieldMinMax('channel1_deadBand')[1]} ${getFieldUnit(1)} (corresponds to 0–20% of span).`"
                    >
                      <FormField
                        label="Dead Band"
                        name="channel1_deadBand"
                        :hint="`[${getFieldMinMax('channel1_deadBand')[0]}...${getFieldMinMax('channel1_deadBand')[1]}]${getFieldUnit(1)}`"
                      >
                        <UInputNumber
                          v-model="state.channel1_deadBand"
                          class="w-full"
                          :min="getFieldMinMax('channel1_deadBand')[0]"
                          :max="getFieldMinMax('channel1_deadBand')[1]"
                          :step="0.01"
                          :disabled="!state.channel1_enabled"
                          :suffix="getFieldUnit(1)"
                        />
                      </FormField>
                    </FormFieldset>
                    <FormFieldset
                      title="Thresholds"
                      class="w-full"
                      :tooltip="`Process alarm configuration for channel 1. Set low/high threshold alarms. Range: ${getFieldMinMax('channel1_alarms_lowThreshold')[0]}–${getFieldMinMax('channel1_alarms_lowThreshold')[1]} ${getFieldUnit(1)} (corresponds to 0–100% of span).`"
                    >
                      <FormField
                        label="Low Threshold"
                        name="channel1_alarms_lowThreshold"
                        :hint="`[${getFieldMinMax('channel1_alarms_lowThreshold')[0]}...${getFieldMinMax('channel1_alarms_lowThreshold')[1]}]${getFieldUnit(1)}`"
                      >
                        <template #tooltip>
                          Triggers if measurement falls below threshold minus dead band.
                          <NuxtImg
                            class="mt-2"
                            src="/imgs/TULIP1_2/low_threshold_alarm.png"
                          />
                        </template>
                        <UInputNumber
                          v-model="state.channel1_alarms_lowThreshold"
                          class="w-full"
                          :min="getFieldMinMax('channel1_alarms_lowThreshold')[0]"
                          :max="getFieldMinMax('channel1_alarms_lowThreshold')[1]"
                          :step="0.01"
                          :disabled="!state.channel1_enabled"
                          :suffix="getFieldUnit(1)"
                        />
                      </FormField>
                      <FormField
                        label="High Threshold"
                        name="channel1_alarms_highThreshold"
                        :hint="`[${getFieldMinMax('channel1_alarms_highThreshold')[0]}...${getFieldMinMax('channel1_alarms_highThreshold')[1]}]${getFieldUnit(1)}`"
                      >
                        <template #tooltip>
                          Triggers if measurement rises above threshold plus dead band.
                          <NuxtImg
                            class="mt-2"
                            src="/imgs/TULIP1_2/high_threshold_alarm.png"
                          />
                        </template>
                        <UInputNumber
                          v-model="state.channel1_alarms_highThreshold"
                          class="w-full"
                          :min="getFieldMinMax('channel1_alarms_highThreshold')[0]"
                          :max="getFieldMinMax('channel1_alarms_highThreshold')[1]"
                          :step="0.01"
                          :disabled="!state.channel1_enabled"
                          :suffix="getFieldUnit(1)"
                        />
                      </FormField>
                    </FormFieldset>
                    <FormFieldset
                      title="Low Threshold With Delay"
                      class="w-full"
                      :tooltip="`Delayed low threshold alarm for channel 1. Value range: ${getFieldMinMax('channel1_alarms_lowThresholdWithDelay_value')[0]}–${getFieldMinMax('channel1_alarms_lowThresholdWithDelay_value')[1]} ${getFieldUnit(1)} (corresponds to 0–100% of span). Delay is in seconds and must be a multiple of both measurement periods (with and without alarm).`"
                    >
                      <FormField
                        label="Value"
                        name="channel1_alarms_lowThresholdWithDelay_value"
                        :hint="`[${getFieldMinMax('channel1_alarms_lowThresholdWithDelay_value')[0]}...${getFieldMinMax('channel1_alarms_lowThresholdWithDelay_value')[1]}]${getFieldUnit(1)}`"
                      >
                        <template #tooltip>
                          Triggers if measurement falls below threshold for the specified delay time.<br>
                          <b>Note:</b> Delay must be a multiple of both measurement periods (with and without alarm).
                          <NuxtImg
                            class="mt-2"
                            src="/imgs/TULIP1_2/low_threshold_alarm_with_delay.png"
                          />
                        </template>
                        <UInputNumber
                          v-model="state.channel1_alarms_lowThresholdWithDelay_value"
                          class="w-full"
                          :min="getFieldMinMax('channel1_alarms_lowThresholdWithDelay_value')[0]"
                          :max="getFieldMinMax('channel1_alarms_lowThresholdWithDelay_value')[1]"
                          :step="0.01"
                          :disabled="!state.channel1_enabled"
                          :suffix="getFieldUnit(1)"
                        />
                      </FormField>
                      <FormField
                        label="Delay"
                        name="channel1_alarms_lowThresholdWithDelay_delay"
                        hint="[0:0:0...18:12:15]"
                      >
                        <template #tooltip>
                          Delay for delayed low alarm. Enter as hours:minutes:seconds. Maximum is 18 hours 12 minutes and 15 seconds (65535 seconds).<br>
                          <b>Note:</b> Delay must be a multiple of both measurement periods (with and without alarm).
                          <NuxtImg
                            class="mt-2"
                            src="/imgs/TULIP1_2/low_threshold_alarm_with_delay.png"
                          />
                        </template>
                        <DurationInput
                          v-model="state.channel1_alarms_lowThresholdWithDelay_delay"
                          class="w-full"
                          :min="0"
                          :max="65535"
                          :disabled="!state.channel1_enabled"
                        />
                      </FormField>
                    </FormFieldset>
                    <FormFieldset
                      title="High Threshold With Delay"
                      class="w-full"
                      :tooltip="`Delayed high threshold alarm for channel 1. Value range: ${getFieldMinMax('channel1_alarms_highThresholdWithDelay_value')[0]}–${getFieldMinMax('channel1_alarms_highThresholdWithDelay_value')[1]} ${getFieldUnit(1)} (corresponds to 0–100% of span). Delay is in seconds and must be a multiple of both measurement periods (with and without alarm).`"
                    >
                      <FormField
                        label="Value"
                        name="channel1_alarms_highThresholdWithDelay_value"
                        :hint="`[${getFieldMinMax('channel1_alarms_highThresholdWithDelay_value')[0]}...${getFieldMinMax('channel1_alarms_highThresholdWithDelay_value')[1]}]${getFieldUnit(1)}`"
                      >
                        <template #tooltip>
                          Triggers if measurement rises above threshold for the specified delay time.<br>
                          <b>Note:</b> Delay must be a multiple of both measurement periods (with and without alarm).
                          <NuxtImg
                            class="mt-2"
                            src="/imgs/TULIP1_2/high_threshold_alarm_with_delay.png"
                          />
                        </template>
                        <UInputNumber
                          v-model="state.channel1_alarms_highThresholdWithDelay_value"
                          class="w-full"
                          :min="getFieldMinMax('channel1_alarms_highThresholdWithDelay_value')[0]"
                          :max="getFieldMinMax('channel1_alarms_highThresholdWithDelay_value')[1]"
                          :step="0.01"
                          :disabled="!state.channel1_enabled"
                          :suffix="getFieldUnit(1)"
                        />
                      </FormField>
                      <FormField
                        label="Delay"
                        name="channel1_alarms_highThresholdWithDelay_delay"
                        hint="[0:0:0...18:12:15]"
                      >
                        <template #tooltip>
                          Delay for delayed high alarm. Enter as hours:minutes:seconds. Maximum is 18 hours 12 minutes and 15 seconds (65535 seconds).<br>
                          <b>Note:</b> Delay must be a multiple of both measurement periods (with and without alarm).
                          <NuxtImg
                            class="mt-2"
                            src="/imgs/TULIP1_2/high_threshold_alarm_with_delay.png"
                          />
                        </template>
                        <DurationInput
                          v-model="state.channel1_alarms_highThresholdWithDelay_delay"
                          class="w-full"
                          :min="0"
                          :max="65535"
                          :disabled="!state.channel1_enabled"
                        />
                      </FormField>
                    </FormFieldset>
                    <FormFieldset
                      title="Slope Alarms"
                      class="w-full"
                      :tooltip="`Slope alarms for channel 1. Rising/falling slope range: ${getFieldMinMax('channel1_alarms_risingSlope')[0]}–${getFieldMinMax('channel1_alarms_risingSlope')[1]} ${getFieldUnit(1)} per minute (corresponds to 0–50% of span).`"
                    >
                      <FormField
                        label="Rising Slope"
                        name="channel1_alarms_risingSlope"
                        :hint="`[${getFieldMinMax('channel1_alarms_risingSlope')[0]}...${getFieldMinMax('channel1_alarms_risingSlope')[1]}]${getFieldUnit(1)}`"
                      >
                        <template #tooltip>
                          Triggers if value rises faster than this slope.
                          <NuxtImg
                            class="mt-2"
                            src="/imgs/TULIP1_2/rising_slope_alarm.png"
                          />
                        </template>
                        <UInputNumber
                          v-model="state.channel1_alarms_risingSlope"
                          class="w-full"
                          :min="getFieldMinMax('channel1_alarms_risingSlope')[0]"
                          :max="getFieldMinMax('channel1_alarms_risingSlope')[1]"
                          :step="0.01"
                          :disabled="!state.channel1_enabled"
                          :suffix="getFieldUnit(1)"
                        />
                      </FormField>
                      <FormField
                        label="Falling Slope"
                        name="channel1_alarms_fallingSlope"
                        :hint="`[${getFieldMinMax('channel1_alarms_fallingSlope')[0]}...${getFieldMinMax('channel1_alarms_fallingSlope')[1]}]${getFieldUnit(1)}`"
                      >
                        <template #tooltip>
                          Triggers if value falls faster than this slope.
                          <NuxtImg
                            class="mt-2"
                            src="/imgs/TULIP1_2/falling_slope_alarm.png"
                          />
                        </template>
                        <UInputNumber
                          v-model="state.channel1_alarms_fallingSlope"
                          class="w-full"
                          :min="getFieldMinMax('channel1_alarms_fallingSlope')[0]"
                          :max="getFieldMinMax('channel1_alarms_fallingSlope')[1]"
                          :step="0.01"
                          :disabled="!state.channel1_enabled"
                          :suffix="getFieldUnit(1)"
                        />
                      </FormField>
                    </FormFieldset>
                    <FormFieldset
                      title="Measurement Offset"
                      class="w-full"
                      :tooltip="`Measurement offset for channel 1. Range: ${getFieldMinMax('channel1_measureOffset')[0]}–${getFieldMinMax('channel1_measureOffset')[1]} ${getFieldUnit(1)} (corresponds to -5 to 5% of span). This value is added to all measurements for calibration.`"
                    >
                      <FormField
                        label="Measurement Offset"
                        name="channel1_measureOffset"
                        :hint="`[${getFieldMinMax('channel1_measureOffset')[0]}...${getFieldMinMax('channel1_measureOffset')[1]}]${getFieldUnit(1)}`"
                      >
                        <template #tooltip>
                          The measurement offset is added to all readings for calibration purposes.
                        </template>
                        <UInputNumber
                          v-model="state.channel1_measureOffset"
                          class="w-full"
                          :min="getFieldMinMax('channel1_measureOffset')[0]"
                          :max="getFieldMinMax('channel1_measureOffset')[1]"
                          :step="0.01"
                          :disabled="!state.channel1_enabled"
                          :suffix="getFieldUnit(1)"
                        />
                      </FormField>
                    </FormFieldset>
                    <FormFieldset
                      title="Start-up Time"
                      class="w-full"
                      tooltip="Start-up time for channel 1. Time in seconds (0.1–15). Only the first decimal place is used. This is the time the device waits after power-up before starting measurements."
                    >
                      <FormField
                        label="Start-up Time"
                        name="channel1_startUpTime"
                        hint="[0.1...15]s"
                      >
                        <template #tooltip>
                          The start-up time is the delay after power-up before the device starts measuring. Useful for sensor stabilization.<br>
                        </template>
                        <UInputNumber
                          v-model="state.channel1_startUpTime"
                          class="w-full"
                          :min="0.1"
                          :max="15"
                          :step="0.1"
                          :disabled="!state.channel1_enabled"
                        />
                      </FormField>
                    </FormFieldset>
                  </EncoderFormLayout>
                </template>
              </UTabs>
              <div class="w-full flex justify-between lg:hidden">
                <div class="flex gap-2">
                  <UButton
                    color="error"
                    class="w-fit"
                    @click="encodeFactoryReset"
                  >
                    Encode factory reset
                  </UButton>
                  <UButton
                    color="warning"
                    class="w-fit"
                    @click="encodeResetBatteryIndicator"
                  >
                    Encode reset battery indicator
                  </UButton>
                </div>
                <UButton
                  variant="solid"
                  class="w-fit"
                  type="submit"
                >
                  Encode Downlink
                </UButton>
              </div>
            </div>
          </Fieldset>
        </div>
      </div>
      <template
        v-if="errors || frames"
        #aside
      >
        <DisplayResult
          class="w-full h-full"
          :data="frames"
          :errors="errors"
          label="Encoded Downlink Frames"
        />
      </template>
    </TabLayout>
  </UForm>
</template>
