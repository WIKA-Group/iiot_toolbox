<script setup lang="ts">
import DeviceList from '~/components/content/DeviceList.vue'

const route = useRoute()

const { data } = await useAsyncData(route.path, () => queryCollection('content').path(route.path).first())

if (!data.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Content not found',
  })
}

const isLanding = computed(() => route.path === '/')

interface TocLink {
  id: string
  text: string
  depth: number
  children?: TocLink[]
}

interface TocEntry extends TocLink {
  depth: number
}

const tocLinks = computed<TocLink[]>(() => {
  const body = data.value?.body as { toc?: { links?: TocLink[] } } | undefined
  return body?.toc?.links ?? []
})

function flattenToc(links: TocLink[], depth = 0): TocEntry[] {
  return links.flatMap(link => [
    { ...link, depth },
    ...flattenToc(link.children ?? [], depth + 1),
  ])
}

const tocEntries = computed(() => flattenToc(tocLinks.value))

const activeId = ref<string>()

function updateActiveId() {
  const offset = 120
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
  let current = tocEntries.value[0]?.id
  for (const entry of tocEntries.value) {
    const el = document.getElementById(entry.id)
    if (el && el.getBoundingClientRect().top <= offset) {
      current = entry.id
    }
  }
  if (atBottom) {
    current = tocEntries.value.at(-1)?.id ?? current
  }
  activeId.value = current
}

onMounted(() => {
  updateActiveId()
  window.addEventListener('scroll', updateActiveId, { passive: true })
  window.addEventListener('resize', updateActiveId)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateActiveId)
  window.removeEventListener('resize', updateActiveId)
})

function tocLinkClass(id: string) {
  return id === activeId.value ? 'font-medium text-primary' : 'text-muted hover:text-primary'
}

useSeoMeta({
  title: data.value?.title,
  description: data.value?.description,
})
</script>

<template>
  <div
    v-if="isLanding"
    class="flex w-full flex-col items-center"
  >
    <ContentRenderer
      v-if="data"
      class="prose prose-wika prose-lg w-full wide:max-w-app frame:max-w-app-wide"
      :value="data"
    />

    <DeviceList
      class="w-full wide:max-w-app frame:max-w-app-wide mt-4"
    />
  </div>

  <div
    v-else
    class="mx-auto grid w-full grid-cols-1 gap-8 frame:max-w-app-wide wide:grid-cols-[minmax(0,1fr)_16rem] wide:gap-12"
  >
    <div class="min-w-0">
      <details
        v-if="tocEntries.length"
        class="mb-6 wide:hidden"
      >
        <summary class="cursor-pointer text-sm font-medium text-highlighted">
          On this page
        </summary>
        <ul class="mt-3 flex flex-col gap-2 border-s-2 border-default ps-3">
          <li
            v-for="entry in tocEntries"
            :key="entry.id"
            :style="{ paddingInlineStart: `${Math.min(entry.depth, 3) * 0.75}rem` }"
          >
            <a
              :href="`#${entry.id}`"
              class="text-sm"
              :class="tocLinkClass(entry.id)"
            >{{ entry.text }}</a>
          </li>
        </ul>
      </details>

      <ContentRenderer
        v-if="data"
        class="prose prose-wika w-full min-w-0 max-w-none"
        :value="data"
      />
    </div>

    <aside
      v-if="tocEntries.length"
      class="hidden wide:block"
    >
      <nav
        class="sticky top-24"
        aria-label="On this page"
      >
        <h2 class="mb-3 text-sm font-medium text-highlighted">
          On this page
        </h2>
        <ul class="flex flex-col gap-2 border-s border-default ps-3">
          <li
            v-for="entry in tocEntries"
            :key="entry.id"
            :style="{ paddingInlineStart: `${Math.min(entry.depth, 3) * 0.75}rem` }"
          >
            <a
              :href="`#${entry.id}`"
              class="text-sm"
              :class="tocLinkClass(entry.id)"
            >{{ entry.text }}</a>
          </li>
        </ul>
      </nav>
    </aside>
  </div>
</template>
