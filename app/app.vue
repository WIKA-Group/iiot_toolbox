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

const { appVersion, parserVersion } = useRuntimeConfig().public

const route = useRoute()

// Match the guide's app-wide grid instead of centering the breadcrumb over the narrow article.
const breadcrumbWidth = computed(() => route.path === '/'
  ? 'wide:max-w-app frame:max-w-app-wide'
  : 'frame:max-w-app-wide')
</script>

<template>
  <UApp :scroll-body="false">
    <div class="flex flex-col w-full min-h-dvh">
      <header class="sticky top-0 z-30 shrink-0 border-b border-default bg-default">
        <div class="frame flex items-center h-16">
          <Header />
        </div>
      </header>

      <main class="flex flex-col grow min-w-0">
        <div class="frame flex flex-col grow min-w-0 pt-8 pb-6 gap-2 md:pt-12 md:pb-8">
          <div
            v-if="breadcrumbs && !widget"
            class="mx-auto w-full shrink-0"
            :class="breadcrumbWidth"
          >
            <UBreadcrumb
              v-if="breadcrumbs"
              :items="breadcrumbs"
            />
            <span
              class="text-muted text-sm"
            >
              {{ widget?.description ?? category!.description }}
            </span>
          </div>

          <NuxtPage />
        </div>
      </main>

      <footer class="shrink-0 border-t border-default">
        <div class="frame flex flex-wrap items-center justify-center gap-x-2 py-2">
          <span class="text-xs text-dimmed">
            {{ appVersion }} · parsers {{ parserVersion }}
          </span>
          <UButton
            variant="link"
            color="neutral"
            size="sm"
            to="https://www.wika.com/en-en/legal_notice.WIKA"
            target="_blank"
            rel="noopener"
            external
            trailing-icon="mdi:launch"
            label="Imprint"
          />
        </div>
      </footer>
    </div>
  </UApp>
</template>
