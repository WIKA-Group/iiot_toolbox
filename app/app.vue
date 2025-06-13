<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'

useHead({
  title: 'Home',
  titleTemplate: 'WIKA IIoT Toolbox - %s',
  meta: [
    {
      name: 'description',
      content: 'WIKA IIoT Toolbox - Toolbox for WIKA IIoT applications and devices',
    },
  ],
})

const { widget, category } = useWidget()

watch(widget, (newWidget) => {
  if (newWidget) {
    useHead({
      title: newWidget.name,
    })
  }
  else {
    useHead({
      title: 'Home',
    })
  }
})

const breadcrumbs = computed<BreadcrumbItem[] | null>(() => {
  if (!category.value) {
    return null
  }
  const items = [] as BreadcrumbItem[]

  items.push({
    label: category.value.name,
    icon: category.value.icon,
    to: category.value.to,
  })

  if (widget.value) {
    items.push({
      label: widget.value.name,
      to: widget.value.to,
    })
  }
  return items
})
</script>

<template>
  <UApp>
    <div class="flex w-dvw h-dvh">
      <Sidebar
        class="h-full w-64 hidden md:flex flex-shrink-0"
      />
      <USeparator
        orientation="vertical"
        class="h-full"
        color="primary"
      />
      <div class="flex flex-col grow h-full overflow-hidden px-4 py-2 gap-2 min-w-0">
        <Header class="w-full my-2" />
        <div
          v-if="breadcrumbs"
        >
          <UBreadcrumb
            v-if="breadcrumbs"
            :items="breadcrumbs"
          />
          <span
            class="text-muted text-sm font-mono"
          >
            {{ widget?.description ?? category!.description }}
          </span>
        </div>
        <UCard
          class="flex flex-col overflow-y-auto grow max-w-full"
          variant="soft"
          :ui="{
            body: 'p-2 px-2 sm:p-4 sm:px-6 grow',
          }"
        >
          <NuxtPage />
        </UCard>
      </div>
    </div>
  </UApp>
</template>
