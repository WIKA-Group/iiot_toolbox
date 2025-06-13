<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

const route = useRoute()
const router = useRouter()

const items = [
  {
    label: 'Decoding',
    value: 'decoding',
    slot: 'decoding' as const,
  },
  {
    label: 'Encoding',
    value: 'encoding',
    slot: 'encoding' as const,
  },
] satisfies TabsItem[]

const active = computed({
  get() {
    return (route.query.tab as string) || 'decoding'
  },
  set(tab) {
    router.push({
      query: { ...route.query, tab },
    })
  },
})
</script>

<template>
  <div class="grow flex flex-col gap-4">
    <UTabs
      v-model="active"
      :items="items"
      variant="pill"
      class="gap-4"
      :ui="{ trigger: 'grow',
             content: 'flex grow',
             root: 'grow',
      }"
    >
      <template #decoding>
        <div class="grow flex flex-col gap-4">
          <div class="grow">
            <slot name="decoding" />
          </div>
        </div>
      </template>

      <template #encoding>
        <div class="grow flex flex-col gap-4">
          <slot name="encoding" />
        </div>
      </template>
    </utabs>
  </div>
</template>
