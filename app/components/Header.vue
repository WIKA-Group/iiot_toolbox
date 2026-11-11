<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

defineShortcuts({
  s: () => openModal(),
})

function openModal() {
  open.value = true
}

const search = ref('')
const open = ref(false)
const slideOverOpen = ref(false)

const { filteredWidgets } = useFilteredWidgets(search)

const tree = computed(() => treeFromWidgets(filteredWidgets.value))

watch(open, (newVal, oldVal) => {
  // when it opens empty the search input
  if (newVal && !oldVal) {
    search.value = ''
  }
})

function closeSearch() {
  open.value = false
}
function openMenu() {
  slideOverOpen.value = true
}
function closeMenu() {
  slideOverOpen.value = false
}

const EXTERNAL = {
  parserDocs: 'https://wika-group.github.io/javascript_parsers/',
  iiotSolutions: 'https://iiot.wika.com/de/iiot.WIKA',
  iiotProducts: 'https://www.wika.com/en-en/iiot_products.WIKA',
  github: 'https://github.com/WIKA-Group/iiot_toolbox',
} as const

function widgetsForCategory(name: string): Widget[] {
  return widgets.filter(widget => widget.category === name)
}

interface DeviceOption {
  label: string
  to: string
  search: string
}

const optionsByCategory = new Map<string, DeviceOption[]>(
  categories.map(category => [
    category.name,
    widgetsForCategory(category.name).map(widget => ({
      label: widget.name,
      to: widget.to,
      search: widget.tags.join(' '),
    })),
  ]),
)

function optionsForCategory(name: string): DeviceOption[] {
  return optionsByCategory.get(name) ?? []
}

const route = useRoute()
const router = useRouter()

function selectedFor(name: string): DeviceOption | undefined {
  return optionsForCategory(name).find(option => option.to === route.path)
}

function goTo(option: DeviceOption | undefined) {
  if (option) router.push(option.to)
}

function triggerLabel(name: string): string {
  return selectedFor(name)?.label ?? name
}

const visibleCategories = computed(() => categories.filter((category) => {
  const prefix: string = category.pathPrefix ?? category.to
  return route.path === prefix || route.path.startsWith(`${prefix}/`)
}))

const categoryItems = computed<NavigationMenuItem[]>(() =>
  categories.map(category => ({
    label: category.name,
    children: widgetsForCategory(category.name)
      .map(widget => ({ label: widget.name, to: widget.to })),
  })),
)

const siteItems = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Parser Docs',
    to: EXTERNAL.parserDocs,
    target: '_blank',
    rel: 'noopener',
    icon: 'mdi:launch',
  },
  {
    label: 'WIKA IIoT',
    children: [
      {
        label: 'IIoT Solutions',
        to: EXTERNAL.iiotSolutions,
        target: '_blank',
        rel: 'noopener',
        icon: 'mdi:launch',
      },
      {
        label: 'IIoT Products',
        to: EXTERNAL.iiotProducts,
        target: '_blank',
        rel: 'noopener',
        icon: 'mdi:launch',
      },
    ],
  },
])
</script>

<template>
  <div class="flex items-center justify-between gap-4 w-full min-w-0">
    <NuxtLink
      to="/"
      class="flex items-center gap-2 shrink-0"
    >

      <NuxtImg
        src="/WIKA.png"
        alt="WIKA"
        quality="10"
        class="h-logo w-auto"
      />

      <span class="hidden sm:inline text-base font-semibold text-highlighted whitespace-nowrap">
        IIoT Toolbox
      </span>
    </NuxtLink>

    <div class="flex items-center gap-3 shrink-0 min-w-0">
      <USelectMenu
        v-for="category in visibleCategories"
        :key="category.name"
        class="hidden wide:flex shrink-0"
        :aria-label="triggerLabel(category.name)"
        :model-value="selectedFor(category.name)"
        :items="optionsForCategory(category.name)"
        :filter-fields="['label', 'search']"
        :placeholder="category.name"
        :search-input="{ placeholder: $t('nav.filterDevices'), icon: 'mdi:magnify' }"
        color="neutral"
        variant="ghost"
        :ui="{
          base: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inverted focus-visible:ring-offset-1 focus-visible:ring-offset-default',
          content: 'w-auto min-w-[var(--reka-popper-anchor-width)] max-w-[var(--reka-popper-available-width)] max-h-[min(30rem,var(--reka-popper-available-height))] shadow-elevation-2!',
        }"
        @update:model-value="goTo"
      />

      <UModal v-model:open="open">
        <UButton
          icon="mdi:magnify"
          color="neutral"
          variant="outline"
          class="w-8 shrink-0 justify-center px-0 sm:w-40 sm:justify-start sm:px-2.5 lg:w-56"
          :aria-label="$t('search')"
          @click="openModal()"
        >
          <span class="hidden text-dimmed sm:inline">
            {{ $t("search") }}
          </span>
          <UKbd
            class="hidden sm:flex ml-auto"
            value="s"
            variant="outline"
          />
        </UButton>
        <template #content>
          <div class="w-full flex flex-col p-4 max-h-96 gap-2">
            <UInput
              v-model="search"
              icon="mdi:magnify"
              size="md"
              variant="outline"
              :placeholder="$t('nav.searchPlaceholder')"
              autofocus
            />

            <template v-if="tree.length">
              <div
                class="flex-1 overflow-y-auto rounded bg-muted border border-default p-2"
              >
                <ul class="flex flex-col gap-2">
                  <li
                    v-for="category in tree"
                    :key="category.name"
                  >
                    <div class="flex items-center gap-2 font-semibold">
                      <UButton
                        class="w-full"
                        :label="category.name"
                        :to="category.to"
                        :icon="category.icon"
                        variant="ghost"
                        @click.stop="closeSearch"
                      />
                    </div>
                    <ul class="ml-6 mt-1 flex flex-col gap-1">
                      <UButton
                        v-for="widget in category.widgets"
                        :key="widget.id"
                        variant="ghost"
                        class="flex text-start items-start gap-2 py-1 px-2 grow"
                        :to="widget.to"
                        @click.stop="closeSearch"
                      >
                        <div>
                          <div class="font-medium text-primary">
                            {{ widget.name }}
                          </div>
                          <div class="text-xs text-muted line-clamp-2">
                            {{ widget.description }}
                          </div>
                        </div>
                      </UButton>
                    </ul>
                  </li>
                </ul>
              </div>
            </template>
            <p
              v-else
              class="rounded border border-dashed border-default px-3 py-6 text-center text-sm text-muted"
              role="status"
            >
              {{ $t('nav.noResults', { query: search }) }}
            </p>
          </div>
        </template>
      </UModal>

      <UNavigationMenu
        class="hidden wide:flex shrink-0 ms-2"
        orientation="horizontal"
        content-orientation="vertical"
        :items="siteItems"
        :ui="{
          viewport: 'shrink-0',
        }"
      />

      <UButton
        class="shrink-0"
        icon="mdi:github"
        color="neutral"
        variant="ghost"
        :to="EXTERNAL.github"
        target="_blank"
        rel="noopener"
        aria-label="GitHub repository"
      />

      <USlideover
        v-model:open="slideOverOpen"
        side="left"
        title="Menu"
      >
        <UButton
          class="wide:hidden shrink-0"
          icon="mdi:menu"
          color="neutral"
          variant="ghost"
          aria-label="Open menu"
          @click="openMenu"
        />
        <template #body>
          <div class="flex flex-col gap-4">
            <div
              v-for="category in categoryItems"
              :key="category.label as string"
              class="flex flex-col"
            >
              <p class="px-2.5 py-1.5 text-xs font-semibold text-highlighted">
                {{ category.label }}
              </p>
              <UButton
                v-for="child in category.children"
                :key="child.label as string"
                :label="child.label as string"
                :to="child.to as string"
                variant="link"
                class="pl-6"
                @click="closeMenu"
              />
            </div>

            <USeparator />

            <div class="flex flex-col">
              <UButton
                label="Parser Docs"
                :to="EXTERNAL.parserDocs"
                target="_blank"
                rel="noopener"
                variant="link"
                trailing-icon="mdi:launch"
                @click="closeMenu"
              />
              <UButton
                label="WIKA IIoT Solutions"
                :to="EXTERNAL.iiotSolutions"
                target="_blank"
                rel="noopener"
                variant="link"
                trailing-icon="mdi:launch"
                @click="closeMenu"
              />
              <UButton
                label="WIKA IIoT Products"
                :to="EXTERNAL.iiotProducts"
                target="_blank"
                rel="noopener"
                variant="link"
                trailing-icon="mdi:launch"
                @click="closeMenu"
              />
              <UButton
                label="GitHub"
                :to="EXTERNAL.github"
                target="_blank"
                rel="noopener"
                variant="link"
                trailing-icon="mdi:launch"
                @click="closeMenu"
              />
            </div>
          </div>
        </template>
      </USlideover>
    </div>
  </div>
</template>
