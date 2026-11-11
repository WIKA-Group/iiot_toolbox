<script setup lang="ts">
type Status = 'decoded' | 'error' | 'empty'

const props = defineProps<{
  data?: object
  errors?: string[]
  warnings?: string[]

  empty?: boolean

  hint?: string

  slug?: string
}>()

const { t } = useI18n()

const view = ref<string>('table')

const status = computed<Status>(() => {
  if (props.errors?.length) return 'error'
  if (props.empty || !props.data) return 'empty'
  return 'decoded'
})

const statusLabel = computed(() => t(`result.status${status.value.charAt(0).toUpperCase()}${status.value.slice(1)}`))

const announcement = computed(() => t(`result.announce${status.value.charAt(0).toUpperCase()}${status.value.slice(1)}`))

const statusClass = computed(() => ({
  decoded: 'bg-success/10 text-success',
  error: 'bg-error/10 text-error',
  empty: 'bg-elevated text-dimmed',
}[status.value]))

const rawJson = computed(() => (props.data ? JSON.stringify(props.data, null, 2) : ''))
const copied = ref(false)
const { copy } = useClipboard()
const toast = useToast()
let copyResetTimer: ReturnType<typeof setTimeout> | undefined

async function copyResult(): Promise<void> {
  try {
    await copy(rawJson.value)
    copied.value = true
    clearTimeout(copyResetTimer)
    copyResetTimer = setTimeout(() => {
      copied.value = false
    }, 2000)
  }
  catch {
    toast.add({
      title: t('result.copyFailed'),
      color: 'error',
      icon: 'mdi:alert',
      duration: 2000,
    })
  }
}

onUnmounted(() => clearTimeout(copyResetTimer))

interface ValueRow {

  section: string
  label: string
  value: string

  key: string

  raw?: unknown

  channelName?: string
}

const HEX_KEYS = new Set(['messageType', 'messageSubType', 'productId', 'productSubId', 'configurationId', 'statusId', 'configStatus'])

function annotate(row: ValueRow): { hex?: string, note?: string } {
  if (typeof row.raw !== 'number' || !HEX_KEYS.has(row.key)) return {}
  const data = props.data as Record<string, unknown>
  const type = typeof data.messageType === 'number' ? data.messageType : undefined
  const topLevel = row.section === ''
  let note: string | undefined
  if (topLevel && row.key === 'messageType') note = messageTypeName(row.raw)
  else if (topLevel && row.key === 'messageSubType' && type !== undefined) note = messageSubTypeName(type, row.raw)
  return { hex: formatHexCode(row.raw), note }
}

function flagState(row: ValueRow): 'active' | 'inactive' | undefined {
  if (typeof row.raw !== 'boolean' || row.section.split(' › ').at(-1) !== 'alarmFlags') return undefined
  return row.raw ? 'active' : 'inactive'
}

async function copyValue(row: ValueRow): Promise<void> {
  try {
    await copy(row.value)
    toast.add({ title: t('result.copied'), icon: 'mdi:check', duration: 1500 })
  }
  catch {
    toast.add({ title: t('result.copyFailed'), color: 'error', icon: 'mdi:alert', duration: 2000 })
  }
}

function flatten(value: unknown, path: string[], rows: ValueRow[], channelName?: string): void {
  if (value === null || value === undefined) return

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      if (entry !== null && typeof entry === 'object') {
        flatten(entry, [...path, String(index + 1)], rows, channelName)
      }
      else {
        rows.push({
          section: path.slice(0, -1).join(' › '),
          label: `${path.at(-1) ?? ''} ${index + 1}`,
          key: path.at(-1) ?? '',
          raw: entry,
          value: String(entry),
          channelName,
        })
      }
    })
    return
  }

  if (typeof value === 'object') {
    const own = (value as Record<string, unknown>).channelName
    const nextChannel = typeof own === 'string' ? own : channelName
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      flatten(entry, [...path, key], rows, nextChannel)
    }
    return
  }

  rows.push({
    section: path.slice(0, -1).join(' › '),
    label: path.at(-1) ?? '',
    key: path.at(-1) ?? '',
    raw: value,
    value: String(value),
    channelName,
  })
}

function unitFor(row: ValueRow): string | undefined {
  if (row.key !== 'value' || !props.slug || !row.channelName) return undefined
  return channelUnit(props.slug, row.channelName)
}

function humanise(key: string): string {
  const spaced = key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

const sections = computed(() => {
  if (!props.data) return []
  const rows: ValueRow[] = []
  flatten(props.data, [], rows)

  const grouped = new Map<string, ValueRow[]>()
  for (const row of rows) {
    const bucket = grouped.get(row.section)
    if (bucket) bucket.push(row)
    else grouped.set(row.section, [row])
  }
  return [...grouped].map(([section, items]) => ({
    section: items[0]?.channelName
      ? humanise(items[0].channelName)
      : section ? section.split(' › ').map(humanise).join(' › ') : '',
    rows: items.map(row => ({ ...row, label: humanise(row.label), unit: unitFor(row), flag: flagState(row), ...annotate(row) })),
  }))
})

const viewItems = computed(() => [
  { value: 'table', label: t('result.viewTable') },
  { value: 'raw', label: t('result.viewRaw') },
])

const panelId = useId()

const mounted = useMounted()

const panelAttrs = computed(() => (mounted.value && status.value === 'decoded'
  ? { 'role': 'tabpanel', 'id': panelId, 'aria-labelledby': `result-tab-${view.value}`, 'tabindex': 0 }
  : {}))

function onTabKeydown(event: KeyboardEvent): void {
  const order = viewItems.value.map(item => item.value)
  const current = order.indexOf(view.value)
  const next = {
    ArrowRight: (current + 1) % order.length,
    ArrowLeft: (current - 1 + order.length) % order.length,
    Home: 0,
    End: order.length - 1,
  }[event.key]
  if (next === undefined) return
  event.preventDefault()
  view.value = order[next] as string

  nextTick(() => document.getElementById(`result-tab-${order[next]}`)?.focus())
}
</script>

<template>
  <section class="flex w-full flex-col">
    <div class="flex min-h-9 flex-wrap items-center gap-3">
      <h2 class="text-lg font-semibold text-highlighted">
        {{ $t('result.title') }}
      </h2>
      <span
        class="rounded-xs px-2 py-0.5 text-xs font-medium"
        :class="statusClass"
      >{{ statusLabel }}</span>
      <span
        v-if="status === 'decoded' && warnings?.length"
        class="rounded-xs bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning"
      >{{ $t('result.warningCount', { count: warnings.length }, warnings.length) }}</span>

      <span
        class="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >{{ announcement }}</span>

      <div
        v-if="status === 'decoded'"
        class="flex w-full items-end justify-end gap-1 self-stretch sm:ms-auto sm:w-auto"
      >
        <UTooltip :text="copied ? $t('result.copied') : $t('result.copyJson')">
          <UButton
            class="mb-0.5"
            color="neutral"
            variant="ghost"
            size="xs"
            :icon="copied ? 'mdi:check' : 'mdi:content-copy'"
            :aria-label="copied ? $t('result.copied') : $t('result.copyJson')"
            @click="copyResult"
          />
        </UTooltip>

        <div
          class="relative z-10 -mb-px flex self-end"
          role="tablist"
          :aria-label="$t('result.viewLabel')"
        >
          <button
            v-for="item in viewItems"
            :id="`result-tab-${item.value}`"
            :key="item.value"
            type="button"
            role="tab"
            :aria-selected="view === item.value"
            :aria-controls="panelId"
            :tabindex="view === item.value ? 0 : -1"
            class="-ms-px cursor-pointer rounded-t-sm border px-2 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset sm:px-3"
            :class="view === item.value
              ? 'border-default border-b-[var(--ui-bg-muted)] bg-muted text-primary'
              : 'border-transparent text-toned hover:text-highlighted'"
            @click="view = item.value"
            @keydown="onTabKeydown"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
    </div>

    <div
      class="border border-default bg-muted"
      :class="view === 'raw' && status === 'decoded'
        ? 'rounded-b-sm rounded-tl-sm'
        : 'rounded-sm'"
    >
      <div
        class="p-3"
        v-bind="panelAttrs"
      >
        <p
          v-if="status === 'empty'"
          class="py-6 text-center text-sm text-muted"
        >
          {{ hint ?? $t('result.emptyHint') }}
        </p>

        <dl
          v-if="status === 'decoded' && view === 'table'"
          class="m-0 grid w-full grid-cols-[auto_1fr] [&>dd:first-of-type]:border-t-0 [&>dt:first-of-type]:border-t-0"
        >
          <template
            v-for="(group, index) in sections"
            :key="group.section || index"
          >
            <div
              v-if="group.section"
              class="col-span-2 pb-1 text-xs font-semibold text-dimmed"
              :class="index > 0 ? 'mt-5' : ''"
            >
              {{ group.section }}
            </div>
            <template
              v-for="row in group.rows"
              :key="`${group.section}-${row.label}`"
            >
              <dt
                class="border-t border-default py-1.5 pe-6 text-sm"
                :class="row.flag === 'inactive' ? 'text-dimmed' : 'text-muted'"
              >
                {{ row.label }}
              </dt>

              <dd class="group m-0 flex items-baseline justify-end gap-1 border-t border-default py-1.5 text-right">
                <UButton
                  color="neutral"
                  variant="link"
                  size="xs"
                  icon="mdi:content-copy"
                  class="self-center p-0.5 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                  :aria-label="$t('result.copyValue')"
                  @click="copyValue(row)"
                />
                <span
                  class="font-mono text-sm font-medium"
                  :class="{
                    'rounded-xs bg-warning/25 px-1.5 font-semibold text-highlighted ring-1 ring-warning': row.flag === 'active',
                    'text-dimmed': row.flag === 'inactive',
                    'text-highlighted': !row.flag,
                  }"
                >{{ row.value }}</span>
                <span
                  v-if="row.hex"
                  class="font-mono text-sm text-muted"
                >({{ row.hex }})</span>
                <span
                  v-if="row.note"
                  class="text-sm text-muted"
                >· {{ row.note }}</span>
                <span
                  v-if="row.unit"
                  class="text-sm text-muted"
                >{{ row.unit }}</span>
              </dd>
            </template>
          </template>
        </dl>

        <Code
          v-if="status === 'decoded' && view === 'raw'"
          class="w-full"
          :code="rawJson"
          :copyable="false"
        />

        <div
          v-if="errors?.length"
          id="result-errors"
          class="rounded-sm bg-error/10 p-3 text-sm text-error"
        >
          <p class="font-semibold">
            {{ $t('result.statusError') }}
          </p>
          <ul class="m-0 list-disc ps-5">
            <li
              v-for="(error, index) in errors"
              :key="index"
            >
              {{ error }}
            </li>
          </ul>
        </div>
        <div
          v-if="warnings?.length"
          class="mt-3 rounded-sm bg-warning/10 p-3 text-sm text-warning first:mt-0"
        >
          <p class="font-semibold">
            {{ $t('result.warnings') }}
          </p>
          <ul class="m-0 list-disc ps-5">
            <li
              v-for="(warning, index) in warnings"
              :key="index"
            >
              {{ warning }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
