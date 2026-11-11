<script setup lang="ts">
const { t } = useI18n()

const resultEl = useTemplateRef<HTMLElement>('resultEl')
const mounted = useMounted()
const resultVisible = useElementVisibility(resultEl)
const { top: resultTop } = useElementBounding(resultEl)

// Only while the result is still further down, e.g. below a long encoder form on a phone.
const showJump = computed(() => mounted.value && !resultVisible.value && resultTop.value > 0)

function jumpToResult() {
  resultEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <!-- auto/1fr rows: the spanning result must not stretch row 1, or the settings jump when the result height changes. -->
  <div class="grid w-full grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:grid-rows-[auto_1fr] lg:gap-8">
    <div class="min-w-0 lg:col-start-1">
      <slot name="input" />
    </div>
    <div
      ref="resultEl"
      class="min-w-0 lg:col-start-2 lg:row-span-2 lg:sticky lg:top-20"
    >
      <slot name="result" />
    </div>
    <div class="min-w-0 lg:col-start-1">
      <slot name="settings" />
    </div>

    <UButton
      v-if="showJump"
      class="fixed right-4 bottom-4 z-30 shadow-elevation-3 lg:hidden"
      size="sm"
      icon="mdi:arrow-down"
      :label="t('result.jump')"
      @click="jumpToResult"
    />
  </div>
</template>
