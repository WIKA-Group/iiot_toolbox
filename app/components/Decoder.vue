<script setup lang="ts">
import type { DecodeHexUplinkFailureOutput, DecodeHexUplinkInput } from '@w2a-iiot/parsers'
import { refDebounced } from '@vueuse/core'

type OutputSuccess = { data: object, warnings?: string[] }
type Output = OutputSuccess | DecodeHexUplinkFailureOutput

const props = defineProps<{
  decodeHexUplink: (input: DecodeHexUplinkInput) => Output

  slug: string
  settingsError?: string
}>()

const { t } = useI18n()

const hexString = useRouteQuery<string>('hexString', '')

const hexInput = ref<string>(hexString.value)
const debouncedHex = refDebounced(hexInput, 300)

watch(debouncedHex, (value) => {
  if (value !== hexString.value) hexString.value = value
})

watch(hexString, (value) => {
  if (value !== hexInput.value) hexInput.value = value
})

const result = shallowRef<Output | undefined>(undefined)

const decodedData = computed<object | undefined>(() =>
  result.value && 'data' in result.value ? result.value.data : undefined)
const errors = computed<string[] | undefined>(() =>
  result.value && 'errors' in result.value ? result.value.errors as string[] : undefined)
const warnings = computed<string[] | undefined>(() =>
  result.value && 'warnings' in result.value ? result.value.warnings as string[] : undefined)
const isEmpty = computed(() => hexInput.value.trim() === '')
const inputError = ref<string | undefined>(undefined)
const settingsError = computed(() => props.settingsError)

const resultHint = computed(() => settingsError.value
  ? t('decoder.fixSettings', { reason: settingsError.value })
  : undefined)

function normaliseHex(value: string): string {
  return value.replace(/\s+/g, '').replace(/^0x/i, '')
}

function decodeHexString() {
  inputError.value = undefined
  if (isEmpty.value) {
    result.value = undefined
    return
  }

  if (settingsError.value) {
    result.value = undefined
    return
  }

  const bytes = normaliseHex(hexInput.value)
  if (!/^[\dA-F]+$/i.test(bytes)) {
    inputError.value = t('decoder.invalidHexCharacters')
  }
  else if (bytes.length % 2 !== 0) {
    inputError.value = t('decoder.invalidHexLength')
  }

  if (inputError.value) {
    result.value = { errors: [inputError.value] }
    return
  }

  try {
    result.value = props.decodeHexUplink({ bytes })
  }
  catch {
    result.value = { errors: [t('decoder.unexpectedError')] }
  }
}

watch([hexInput, settingsError], () => decodeHexString(), { immediate: true })

const examples = computed(() => EXAMPLE_UPLINKS[props.slug] ?? [])
const exampleOptions = computed(() => examples.value.map(example => ({
  ...example,
  label: example.description,
  search: `${example.description} ${example.hex}`,
})))

function useExample(example: { hex: string } | undefined) {
  if (!example) return
  hexInput.value = example.hex
}

defineExpose({ decodeHexString })
</script>

<template>
  <SplitPane>
    <template #input>
      <div class="flex flex-col gap-4">
        <div class="flex min-w-0 flex-col">
          <div class="flex min-h-9 items-center">
            <label
              for="hex-input"
              class="text-lg font-semibold text-highlighted"
            >{{ t('decoder.hexLabel') }}</label>
          </div>
          <UTextarea
            id="hex-input"
            v-model="hexInput"
            :aria-describedby="inputError ? 'result-errors' : undefined"
            :aria-invalid="inputError ? 'true' : undefined"
            :rows="3"
            autoresize
            :maxrows="8"
            :placeholder="t('decoder.hexPlaceholder')"
            :ui="{
              base: 'font-mono text-sm leading-relaxed p-3 rounded-sm focus-visible:ring-2 focus-visible:ring-primary',
            }"
          />
        </div>

        <div
          v-if="examples.length"
          class="flex flex-col gap-1.5"
        >
          <label
            for="example-payload"
            class="text-sm font-medium text-highlighted"
          >{{ t('decoder.examplesLabel') }}</label>
          <USelectMenu
            id="example-payload"
            class="w-full"
            :model-value="undefined"
            :items="exampleOptions"
            :filter-fields="['label', 'search']"
            :placeholder="t('decoder.examplePlaceholder')"
            :search-input="{ placeholder: t('decoder.exampleSearch'), icon: 'mdi:magnify' }"
            :ui="{
              content: 'w-[var(--reka-popper-anchor-width)] max-h-[min(26rem,var(--reka-popper-available-height))] shadow-elevation-2!',
              item: 'items-start py-2.5',
            }"
            @update:model-value="useExample"
          >
            <template #item-label="{ item }">
              <span class="flex min-w-0 flex-col gap-0.5">
                <span class="whitespace-normal text-sm text-highlighted">{{ item.description }}</span>
                <span class="truncate font-mono text-xs text-dimmed">{{ item.hex }}</span>
              </span>
            </template>
          </USelectMenu>
        </div>
      </div>
    </template>

    <template #result>
      <ResultPanel
        :data="decodedData"
        :errors="errors"
        :warnings="warnings"
        :empty="isEmpty"
        :hint="resultHint"
        :slug="slug"
      />
    </template>

    <template #settings>
      <div class="border-t border-default pt-6">
        <EncoderSection
          :level="3"
          boxed
          :title="t('decoder.settingsLabel')"
        >
          <slot name="settings" />
        </EncoderSection>
      </div>
    </template>
  </SplitPane>
</template>
