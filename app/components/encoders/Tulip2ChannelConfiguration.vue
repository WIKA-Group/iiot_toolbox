<script setup lang="ts">
import { limitMessage, limitViolation, probeChannel, rangePlaceholder } from '~/utils/tulip2Channels'

const props = defineProps<{
  encodeDownlink: (input: never) => unknown
  channel: string
}>()

const { t } = useI18n()

const probe = computed(() => probeChannel(props.encodeDownlink, props.channel))

const standardFields = computed(() => probe.value.fields.filter(field => field.kind !== 'delayedThreshold'))

const delayedThresholds = computed(() => probe.value.fields.filter(field => field.kind === 'delayedThreshold'))

const values = useRouteQuery<string>('t2Chan', '')

const parsed = computed(() => {
  const map = new Map<string, string>()
  for (const pair of values.value.split(';')) {
    const separator = pair.indexOf(':')
    if (separator < 1) continue
    map.set(pair.slice(0, separator), pair.slice(separator + 1))
  }
  return map
})

const read = (field: string) => parsed.value.get(`${props.channel}.${field}`) ?? ''

function write(field: string, raw: string) {
  const next = new Map(parsed.value)
  const key = `${props.channel}.${field}`
  if (raw === '') next.delete(key)
  else next.set(key, raw)
  values.value = [...next].map(([k, v]) => `${k}:${v}`).join(';')
}

const CONFIGURE = 'configure'

const stateItems = computed(() => [
  ...(probe.value.booleanOnly ? [] : [{ label: t('encoder.tulip2.channel.stateConfigure'), value: CONFIGURE }]),
  ...probe.value.booleans.map(value => ({
    label: value ? t('encoder.tulip2.channel.stateEnabled') : t('encoder.tulip2.channel.stateDisabled'),
    value: String(value),
  })),
])

const state = computed(() => read('state') || CONFIGURE)

const isSwitched = computed(() => state.value === 'true' || state.value === 'false')

function setState(raw: string) {
  write('state', raw === CONFIGURE ? '' : raw)
}

const DELAY_RANGE = { min: 0, max: 65535 }

// Threshold and delay are one value for the parser: filling one half marks the other as missing.
function halfMissing(field: { name: string }, part: 'value' | 'delay'): boolean {
  const hasValue = read(`${field.name}.value`) !== ''
  const hasDelay = read(`${field.name}.delay`) !== ''
  return part === 'value' ? !hasValue && hasDelay : hasValue && !hasDelay
}

function delayedError(field: { name: string, min?: number, max?: number }): string | undefined {
  return limitError(field, read(`${field.name}.value`))
    ?? limitError(DELAY_RANGE, read(`${field.name}.delay`))
    ?? (halfMissing(field, 'value') || halfMissing(field, 'delay')
      ? t('encoder.tulip2.channel.delayedThresholdIncomplete', { field: t(`encoder.tulip2.channel.field.${field.name}`) })
      : undefined)
}

function limitError(field: { min?: number, max?: number }, raw: string): string | undefined {
  return limitViolation(field, raw) ? limitMessage(t, field) : undefined
}

const alarmValueSet = computed(() => probe.value.fields.some(field =>
  field.group === 'alarms' && field.name !== 'deadBand'
  && (field.kind === 'delayedThreshold'
    ? read(`${field.name}.value`) !== '' || read(`${field.name}.delay`) !== ''
    : read(field.name) !== ''),
))

function fieldError(field: { name: string, min?: number, max?: number }, raw: string): string | undefined {
  if (field.name === 'deadBand' && raw === '' && alarmValueSet.value) return t('encoder.tulip2.channel.deadBandNeeded')
  return limitError(field, raw)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <FormField
      v-if="probe.booleans.length"
      :label="t('encoder.tulip2.channel.stateLabel')"
      :help="probe.booleanOnly
        ? t('encoder.tulip2.channel.booleanOnly')
        : t('encoder.tulip2.channel.stateHelp')"
      :name="`${channel}.state`"
    >
      <USelect
        :model-value="state"
        class="w-full max-w-72"
        :items="stateItems"
        value-key="value"
        @update:model-value="value => setState(String(value ?? ''))"
      />
    </FormField>

    <p
      v-if="probe.booleanOnly && !probe.booleans.length"
      class="text-xs text-muted"
    >
      {{ t('encoder.tulip2.channel.nothingAccepted') }}
    </p>

    <template v-if="!probe.booleanOnly && !isSwitched">
      <div class="grid gap-x-6 sm:grid-cols-2">
        <FormField
          v-for="field in standardFields"
          :key="field.name"
          :label="t(`encoder.tulip2.channel.field.${field.name}`)"
          :problem="fieldError(field, read(field.name))"
          :name="`${channel}.${field.name}`"
        >
          <ClearableInput
            :model-value="read(field.name)"
            :min="field.min"
            :max="field.max"
            :placeholder="rangePlaceholder(field)"
            @update:model-value="value => write(field.name, value)"
          />
        </FormField>
      </div>

      <section
        v-if="delayedThresholds.length"
        class="border-l-2 border-primary/40 ps-3"
      >
        <OverlineLabel>{{ t('encoder.tulip2.channel.delayedThresholdsTitle') }}</OverlineLabel>
        <div class="mt-2 grid gap-3 sm:grid-cols-2">
          <div
            v-for="field in delayedThresholds"
            :key="field.name"
            class="min-w-0"
          >
            <p class="text-sm font-medium text-highlighted">
              {{ t(`encoder.tulip2.channel.field.${field.name}`) }}
              <FieldProblem
                v-if="delayedError(field)"
                :message="delayedError(field)!"
              />
            </p>
            <div class="mt-1.5 grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
              <label class="flex min-w-0 flex-col gap-1 text-xs text-dimmed">
                {{ t('encoder.tulip2.channel.delayedThresholdValue') }}
                <ClearableInput
                  :model-value="read(`${field.name}.value`)"
                  :min="field.min"
                  :max="field.max"
                  :placeholder="rangePlaceholder(field)"
                  :color="limitError(field, read(`${field.name}.value`)) || halfMissing(field, 'value') ? 'error' : undefined"
                  :highlight="!!limitError(field, read(`${field.name}.value`)) || halfMissing(field, 'value')"
                  :aria-label="`${t(`encoder.tulip2.channel.field.${field.name}`)} ${t('encoder.tulip2.channel.delayedThresholdValue')}`"
                  @update:model-value="value => write(`${field.name}.value`, value)"
                />
              </label>
              <label class="flex flex-col gap-1 text-xs text-dimmed">
                {{ t('encoder.tulip2.channel.delayedThresholdDelay') }}
                <ClearableInput
                  :model-value="read(`${field.name}.delay`)"
                  :min="DELAY_RANGE.min"
                  :max="DELAY_RANGE.max"
                  :step="1"
                  :placeholder="rangePlaceholder(DELAY_RANGE)"
                  :color="limitError(DELAY_RANGE, read(`${field.name}.delay`)) || halfMissing(field, 'delay') ? 'error' : undefined"
                  :highlight="!!limitError(DELAY_RANGE, read(`${field.name}.delay`)) || halfMissing(field, 'delay')"
                  :aria-label="`${t(`encoder.tulip2.channel.field.${field.name}`)} ${t('encoder.tulip2.channel.delayedThresholdDelay')}`"
                  @update:model-value="value => write(`${field.name}.delay`, value)"
                />
              </label>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
