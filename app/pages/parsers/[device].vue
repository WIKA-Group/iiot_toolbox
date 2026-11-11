<script setup lang="ts">
import Tulip2Encoder from '~/components/encoders/Tulip2Encoder.vue'
import Tulip3Encoder from '~/components/encoders/Tulip3Encoder.vue'
import { loadDeviceParserFactory } from '~/utils/devices'

definePageMeta({ key: route => route.path })

const route = useRoute()
const { t } = useI18n()

// Grey canvas with white surfaces; see .tool-canvas in main.css.
useHead({ bodyAttrs: { class: 'tool-canvas' } })

const slug = String(route.params.device ?? '')
const resolved = getDevice(slug)
if (!resolved) {
  throw createError({
    statusCode: 404,
    statusMessage: `Unknown device: ${slug}`,
    fatal: true,
  })
}

const device = resolved
const parserFactory = await loadDeviceParserFactory(device)

const parser = shallowRef(parserFactory())

const roundingDecimals = useRouteQuery('roundingDecimals', 4, { transform: Number })

// The shared input works on text; an empty field becomes NaN, which the rounding check reports.
const roundingText = computed({
  get: () => (Number.isNaN(roundingDecimals.value) ? '' : String(roundingDecimals.value)),
  set: (value: string) => {
    roundingDecimals.value = value === '' ? Number.NaN : Number(value)
  },
})

type RangeInput = string | number | null | undefined

const activeRanges = resolveChannelRanges(parserFactory, device.channels)

const channelRanges = device.channels.map((channel) => {
  const active = activeRanges.get(channel)
  return {
    channel,
    active,

    start: useRouteQuery<RangeInput>(channelQueryKey(channel, 'Start'), active ? String(active.start) : ''),
    end: useRouteQuery<RangeInput>(channelQueryKey(channel, 'End'), active ? String(active.end) : ''),
  }
})

function isAtDeviceDefault(entry: typeof channelRanges[number]): boolean {
  if (!entry.active) return false
  const range = parseRange(entry.start.value, entry.end.value)
  return !!range && range.start === entry.active.start && range.end === entry.active.end
}

function toBound(value: RangeInput): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parseRange(start: RangeInput, end: RangeInput): { start: number, end: number } | null {
  const s = toBound(start)
  const e = toBound(end)
  if (s === null || e === null) return null
  return { start: s, end: e }
}

function isUsingDefaultRange(start: RangeInput, end: RangeInput): boolean {
  return parseRange(start, end) === null
}

function formatChannelName(channel: string): string {
  return device.measuringRangeLabels?.[channel] ?? channel.replace(/([a-zA-Z])(\d)/g, '$1 $2')
}

const capitalized = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

function resetRange(entry: typeof channelRanges[number]): void {
  entry.start.value = entry.active ? String(entry.active.start) : ''
  entry.end.value = entry.active ? String(entry.active.end) : ''
}

function rangeError(entry: typeof channelRanges[number]): string | undefined {
  const start = toBound(entry.start.value)
  const end = toBound(entry.end.value)
  if (start === null && end === null) return undefined
  if (start === null || end === null) return t('device.measuringRangeIncomplete')
  if (start >= end) return t('device.measuringRangeOrder')
  return undefined
}

const roundingError = computed(() => Number.isInteger(roundingDecimals.value) && roundingDecimals.value >= 0
  ? undefined
  : t('device.roundingInvalid'))

const settingsError = computed(() => roundingError.value
  ?? channelRanges
    .map(entry => rangeError(entry) && `${formatChannelName(entry.channel)}: ${rangeError(entry)}`)
    .find(Boolean))

const downloadError = ref<string | undefined>(undefined)

watch(settingsError, () => {
  downloadError.value = undefined
})

async function downloadParser() {
  downloadError.value = undefined
  if (settingsError.value) {
    downloadError.value = t('device.downloadBlocked', { reason: settingsError.value })
    return
  }
  const { loadRawParser } = await import('~/utils/rawParsers')
  const loadedCode = await loadRawParser(device.rawDir)
  if (!loadedCode) {
    downloadError.value = t('device.downloadUnavailable', { device: device.label })
    console.error(`No raw parser bundle for "${device.rawDir}".`)
    return
  }

  let code = loadedCode
  code += '\n'
  code += `\n// Adjust rounding decimals\nadjustRoundingDecimals(${roundingDecimals.value});\n`
  for (const { channel, start, end } of channelRanges) {
    const range = parseRange(start.value, end.value)
    if (!range) continue
    code += `\n// Adjust measuring range\nadjustMeasuringRange(${JSON.stringify(channel)}, ${JSON.stringify(range)});\n`
  }

  const blob = new Blob([code], { type: 'text/javascript' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${device.slug}.js`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const decoder = useTemplateRef('decoder')

watchEffect(() => {
  if (settingsError.value) return
  const next = parserFactory()
  next.adjustRoundingDecimals(roundingDecimals.value)
  for (const { channel, start, end } of channelRanges) {
    const range = parseRange(start.value, end.value)
    if (range) next.adjustMeasuringRange(channel, range)
  }
  parser.value = next
})

watch(
  [parser, decoder],
  async () => {
    await nextTick()
    decoder.value?.decodeHexString()
  },
  { immediate: true },
)

const encodableProtocols = computed<Protocol[]>(() => [...device.encodes])

const protocol = useRouteQuery<string>('protocol', encodableProtocols.value[0] ?? 'TULIP3')

const activeProtocol = computed<Protocol>(() =>
  encodableProtocols.value.includes(protocol.value as Protocol)
    ? protocol.value as Protocol
    : encodableProtocols.value[0] ?? 'TULIP3',
)

const protocolItems = computed(() =>
  encodableProtocols.value.map(value => ({ label: value, value: value as string })),
)

const modeItems = computed(() => [
  { value: 'decoding', label: t('mode.decode') },
  ...(encodableProtocols.value.length > 0 ? [{ value: 'encoding', label: t('mode.encode') }] : []),
])

const modeQuery = useRouteQuery<string>('tab', 'decoding')

const mode = computed({
  get: () => modeItems.value.some(item => item.value === modeQuery.value) ? modeQuery.value : 'decoding',
  set: (value: string) => { modeQuery.value = value },
})

useSeoMeta({
  title: device.label,
  description: device.description,
})
</script>

<template>
  <div class="w-full flex flex-col gap-6 mx-auto wide:max-w-app frame:max-w-app-wide">
    <DeviceHeader
      :device="device"
      :download-error="downloadError"
      @download="downloadParser()"
    />

    <SegmentedTabs
      v-model="mode"
      :items="modeItems"
      :label="t('axis.mode')"
    >
      <template #trailing>
        <div
          v-if="mode === 'encoding' && encodableProtocols.length > 1"
          class="flex items-center gap-3"
        >
          <span
            class="hidden h-6 w-px bg-[var(--ui-border-accented)] sm:block"
            aria-hidden="true"
          />
          <span class="text-sm text-muted">{{ t('encoder.protocolLabel') }}</span>
          <SegmentedControl
            v-model="protocol"
            variant="chips"
            :items="protocolItems"
            :label="t('encoder.protocolLabel')"
          />
        </div>
      </template>
      <template #decoding>
        <Decoder
          ref="decoder"
          :decode-hex-uplink="parser.decodeHexUplink"
          :slug="device.slug"
          :settings-error="settingsError"
        >
          <template #settings>
            <div class="grid grid-cols-[1fr_auto_1fr] items-center justify-start gap-x-3 gap-y-2 sm:grid-cols-[minmax(5rem,auto)_8rem_auto_8rem_auto]">
              <span
                class="col-span-3 flex items-center gap-1 text-sm text-default sm:col-span-1"
                aria-hidden="true"
              >
                {{ t('device.roundingLabel') }}
                <span class="inline-flex size-4 shrink-0 items-center justify-center">
                  <FieldProblem
                    v-if="roundingError"
                    :message="roundingError"
                  />
                </span>
              </span>
              <FormField
                class="col-span-3 sm:col-span-1"
                :label="t('device.roundingLabel')"
                hide-label
                :problem="roundingError"
                name="roundingDecimals"
              >
                <ClearableInput
                  v-model="roundingText"
                  :clearable="false"
                  :min="0"
                />
              </FormField>

              <OverlineLabel
                v-if="channelRanges.length"
                tag="p"
                class="col-span-3 mt-4 sm:col-span-5"
              >
                {{ t('device.measuringRangesLabel') }}
              </OverlineLabel>

              <template
                v-for="range in channelRanges"
                :key="range.channel"
              >
                <span class="col-span-3 mt-2 flex items-center gap-1 text-sm text-default sm:col-span-1 sm:mt-0">
                  {{ capitalized(formatChannelName(range.channel)) }}
                  <span class="inline-flex size-4 shrink-0 items-center justify-center">
                    <FieldProblem
                      v-if="rangeError(range)"
                      :message="rangeError(range)!"
                    />
                  </span>
                </span>
                <FormField
                  :label="t('device.measuringRangeStartFor', { channel: formatChannelName(range.channel) })"
                  hide-label
                  :problem="rangeError(range)"
                  :name="`range-${range.channel}-start`"
                >
                  <ClearableInput
                    v-model="range.start.value"
                    :clearable="false"
                    :placeholder="t('device.measuringRangeStart')"
                  />
                </FormField>
                <span class="text-sm text-dimmed">{{ t('device.measuringRangeTo') }}</span>
                <FormField
                  :label="t('device.measuringRangeEndFor', { channel: formatChannelName(range.channel) })"
                  hide-label
                  :problem="rangeError(range)"
                  :name="`range-${range.channel}-end`"
                >
                  <ClearableInput
                    v-model="range.end.value"
                    :clearable="false"
                    :placeholder="t('device.measuringRangeEnd')"
                  />
                </FormField>
                <div class="col-span-3 sm:col-span-1">
                  <UButton
                    v-if="!isAtDeviceDefault(range) && !isUsingDefaultRange(range.start.value, range.end.value)"
                    color="neutral"
                    variant="link"
                    size="xs"
                    class="[@media(pointer:coarse)]:min-h-11"
                    :label="t('device.measuringRangeReset')"
                    @click="resetRange(range)"
                  />
                </div>
              </template>
            </div>
          </template>
        </Decoder>
      </template>

      <template
        v-if="encodableProtocols.length > 0"
        #encoding
      >
        <div class="flex flex-col gap-4">
          <Tulip2Encoder
            v-if="activeProtocol === 'TULIP2'"
            :encode-downlink="parser.encodeDownlink!"
            :covered-actions="device.tulip2ConfigurationForm ? ['configuration'] : []"
            :channel-labels="device.tulip2ChannelLabels"
          >
            <template #form>
              <component
                :is="device.tulip2ConfigurationForm"
                :encode-multiple-downlinks="parser.encodeMultipleDownlinks"
                :encode-downlink="parser.encodeDownlink!"
                :channel-labels="device.tulip2ChannelLabels"
              />
            </template>
          </Tulip2Encoder>
          <Tulip3Encoder
            v-else-if="activeProtocol === 'TULIP3'"
            :encode-downlink="parser.encodeDownlink!"
            :encode-multiple-downlinks="parser.encodeMultipleDownlinks"
            :slug="device.slug"
            :channel-labels="device.tulip3ChannelLabels"
          />
        </div>
      </template>
    </SegmentedTabs>
  </div>
</template>
