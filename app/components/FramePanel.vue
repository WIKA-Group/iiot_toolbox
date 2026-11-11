<script setup lang="ts">
const props = defineProps<{

  frames?: string[]
  fPort?: number
  errors?: string[]
  hint?: string
}>()

const { t } = useI18n()

const status = computed(() => {
  if (props.errors?.length) return 'error'
  if (!props.frames?.length) return 'empty'
  return 'encoded'
})

const statusClass = computed(() => ({
  encoded: 'bg-success/10 text-success',
  error: 'bg-error/10 text-error',
  empty: 'bg-elevated text-dimmed',
}[status.value]))

const multiple = computed(() => status.value === 'encoded' && (props.frames?.length ?? 0) > 1)

const firstFrame = computed(() => props.frames?.[0] ?? '')

// Groups of four bytes wrap between values, not inside them; the copied text stays unspaced.
function groupsOf(frame: string): string[] {
  const groups = frame.replace(/^0x/, '').match(/.{1,8}/g) ?? []
  return groups.length ? [`0x${groups[0]}`, ...groups.slice(1)] : []
}

const copiedFrame = ref<number | undefined>(undefined)
let frameTimer: ReturnType<typeof setTimeout> | undefined

async function copyFrame(index: number) {
  const frame = props.frames?.[index]
  if (!frame) return
  await navigator.clipboard.writeText(frame)
  copiedFrame.value = index
  clearTimeout(frameTimer)
  frameTimer = setTimeout(() => {
    copiedFrame.value = undefined
  }, 2000)
}

const copied = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | undefined

type CopyFormat = 'hex' | 'plain' | 'base64'

function bytesOf(frame: string): number[] {
  return (frame.replace(/^0x/, '').match(/../g) ?? []).map(pair => Number.parseInt(pair, 16))
}

function formatFrame(frame: string, format: CopyFormat): string {
  if (format === 'plain') return frame.replace(/^0x/, '')
  if (format === 'base64') return btoa(String.fromCharCode(...bytesOf(frame)))
  return frame
}

async function copy(format: CopyFormat = 'hex') {
  if (!props.frames?.length) return
  await navigator.clipboard.writeText(props.frames.map(frame => formatFrame(frame, format)).join('\n'))
  copied.value = true
  clearTimeout(resetTimer)
  resetTimer = setTimeout(() => {
    copied.value = false
  }, 2000)
}

const copyItems = computed(() => [[
  { label: t('encoder.copyHex'), onSelect: () => copy('hex') },
  { label: t('encoder.copyPlain'), onSelect: () => copy('plain') },
  { label: t('encoder.copyBase64'), onSelect: () => copy('base64') },
]])

function frameMeta(frame: string): string {
  const count = bytesOf(frame).length
  const parts = [t('encoder.frameBytes', { count }, count)]
  if (props.fPort !== undefined) parts.push(t('encoder.framePort', { port: props.fPort }))
  return parts.join(' · ')
}

onUnmounted(() => {
  clearTimeout(resetTimer)
  clearTimeout(frameTimer)
})
</script>

<template>
  <section class="flex w-full flex-col gap-3">
    <div class="flex min-h-9 flex-wrap items-center gap-3">
      <h2 class="text-lg font-semibold text-highlighted">
        {{ t('encoder.frameTitle') }}
      </h2>
      <span
        class="rounded-xs px-2 py-0.5 text-xs font-medium"
        :class="statusClass"
      >{{ t(`encoder.status.${status}`) }}</span>

      <span
        class="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >{{ t(`encoder.announce.${status}`) }}</span>

      <div
        v-if="frames?.length"
        class="ms-auto flex items-center"
      >
        <UButton
          class="rounded-e-none"
          color="neutral"
          variant="outline"
          size="xs"
          :icon="copied ? 'mdi:check' : 'mdi:content-copy'"
          @click="copy()"
        >
          {{ copied ? t('result.copied') : multiple ? t('encoder.copyAll') : t('result.copy') }}
        </UButton>
        <UDropdownMenu
          :items="copyItems"
          :content="{ align: 'end' }"
        >
          <UButton
            class="-ms-px rounded-s-none"
            color="neutral"
            variant="outline"
            size="xs"
            icon="mdi:chevron-down"
            :aria-label="t('encoder.copyAs')"
          />
        </UDropdownMenu>
      </div>
    </div>

    <div
      v-if="!multiple"
      class="h-32 overflow-y-auto rounded-sm p-4 lg:h-26"
      :class="status === 'error' ? 'bg-error/10 text-error' : 'bg-[var(--wika-output,#f7f7f7)]'"
    >
      <!-- Fixed height for every state; on wide screens it ends at the separator below the action picker (two button rows). -->
      <p
        v-if="status === 'empty'"
        class="text-sm text-muted"
      >
        {{ hint ?? t('encoder.frameEmpty') }}
      </p>

      <template v-else-if="status === 'error'">
        <p class="font-semibold">
          {{ t('encoder.status.error') }}
        </p>
        <ul class="m-0 mt-1 list-disc ps-5 text-sm">
          <li
            v-for="(error, index) in errors"
            :key="index"
          >
            {{ error }}
          </li>
        </ul>
      </template>

      <template v-else>
        <p class="font-mono text-lg font-medium leading-snug text-highlighted">
          <span
            v-for="(group, index) in groupsOf(firstFrame)"
            :key="index"
            class="me-3 inline-block"
          >{{ group }}</span>
        </p>
        <p class="mt-2 text-sm text-muted">
          {{ frameMeta(firstFrame) }}
        </p>
      </template>
    </div>

    <template v-else>
      <InfoNote>
        {{ t('encoder.multipleFrames', { count: frames!.length }) }}
      </InfoNote>

      <ul class="m-0 flex list-none flex-col gap-2 p-0">
        <li
          v-for="(frame, index) in frames"
          :key="index"
          class="rounded-sm bg-[var(--wika-output,#f7f7f7)] p-4"
        >
          <div class="flex items-center justify-between gap-3">
            <p class="text-sm font-medium text-highlighted">
              {{ t('encoder.frameNumber', { n: index + 1, total: frames!.length }) }}
              <span class="font-normal text-muted">· {{ frameMeta(frame) }}</span>
            </p>
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              :icon="copiedFrame === index ? 'mdi:check' : 'mdi:content-copy'"
              :aria-label="t('encoder.copyFrame', { n: index + 1 })"
              @click="copyFrame(index)"
            />
          </div>
          <p class="mt-2 font-mono text-lg font-medium leading-snug text-highlighted">
            <span
              v-for="(group, groupIndex) in groupsOf(frame)"
              :key="groupIndex"
              class="me-3 inline-block"
            >{{ group }}</span>
          </p>
        </li>
      </ul>
    </template>
  </section>
</template>
