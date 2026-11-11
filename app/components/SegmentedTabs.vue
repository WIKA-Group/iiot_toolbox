<script setup lang="ts">
const props = defineProps<{
  items: readonly { value: string, label: string }[]

  label: string
}>()

const model = defineModel<string>({ required: true })

const tabItems = computed(() => props.items.map(item => ({
  label: item.label,
  value: item.value,
})))

const root = useTemplateRef<{ $el?: HTMLElement }>('root')

onMounted(() => {
  root.value?.$el?.querySelector('[role="tablist"]')?.setAttribute('aria-label', props.label)
})
</script>

<template>
  <div class="flex w-full flex-col gap-4">
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <UTabs
        ref="root"
        v-model="model"
        :items="tabItems"
        :content="false"
        :ui="{
          root: 'flex items-center',
          list: 'flex flex-wrap gap-1 rounded-sm bg-accented p-1 w-fit max-w-full',
          indicator: 'hidden',
          trigger: [
            'flex-none cursor-pointer select-none rounded-xs px-3 py-1.5 [@media(pointer:coarse)]:py-3',
            'text-sm font-medium text-toned transition-colors',
            'hover:text-highlighted',
            'data-[state=active]:bg-default data-[state=active]:text-primary data-[state=active]:shadow-elevation-1',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-accented',
          ].join(' '),
        }"
      />
      <slot name="trailing" />
    </div>

    <div
      v-for="item in items"
      v-show="model === item.value"
      :key="item.value"
      role="tabpanel"
      :aria-label="item.label"
      class="w-full"
    >
      <slot :name="item.value" />
    </div>
  </div>
</template>
