<script setup lang="ts">
defineShortcuts({
  s: () => openModal(),
})

function openModal() {
  open.value = true
}

const search = ref('')
const open = ref(false)

const { filteredWidgets } = useFilteredWidgets(search)

const tree = computed(() => treeFromWidgets(filteredWidgets.value))

watch(open, (newVal, oldVal) => {
  // when it opens empty the search input
  if (newVal && !oldVal) {
    search.value = ''
  }
})

const colorMode = useColorMode()
const isDark = computed({
  get() {
    return colorMode.value === 'dark'
  },
  set(_isDark) {
    colorMode.preference = _isDark ? 'dark' : 'light'
  },
})

const { locale, setLocale } = useI18n()

/* const formatedLocales = computed<{
  label: string
  value: string
  icon?: string
}[]>(() => {
  return locales.value.map((locale) => {
    const { name, code, icon } = locale
    return {
      label: name,
      value: code,
      icon: icon as string | undefined,
    }
  }) as unknown as {
    label: string
    value: string
    icon?: string
  }[]
}) */

watchEffect(() => {
  setLocale(locale.value)
})

const slideOverOpen = ref(false)
</script>

<template>
  <div class="flex items-center gap-2">
    <USlideover
      v-model:open="slideOverOpen"
      side="left"
    >
      <UButton
        class="md:hidden"
        icon="mdi:menu"
        color="primary"
        variant="soft"
        size="xl"
        @click="slideOverOpen = true"
      />
      <template #content>
        <div class="flex flex-col h-full gap-2 py-2">
          <div class="flex px-2">
            <UButton
              icon="mdi:close"
              color="primary"
              variant="soft"
              size="xl"
              @click="slideOverOpen = false"
            />
          </div>
          <Sidebar
            class="h-full w-full"
            @link-opened="slideOverOpen = false"
          >
            <div class="w-full flex">
              <UButton
                trailing-icon="mdi:arrow-left"
                color="primary"
                variant="soft"
                size="xl"
              />
            </div>
          </Sidebar>
        </div>
      </template>
    </USlideover>
    <UButton
      icon="mdi:home"
      size="xl"
      color="primary"
      variant="solid"
      to="/"
    />
    <UModal v-model:open="open">
      <UButton
        icon="mdi:magnify"
        color="primary"
        variant="soft"
        class="h-fit grow"
        size="xl"
        @click="openModal()"
      >
        <span class="mr-2">
          {{ $t("search") }}
        </span>
        <UKbd
          class="hidden sm:flex"
          value="s"
          variant="outline"
        />
      </UButton>
      <template #content>
        <div class="w-full flex flex-col p-4 max-h-96 min-w-[28rem] gap-2">
          <UInput
            v-model="search"
            icon="mdi:magnify"

            size="md"
            variant="outline"
            placeholder="Search widgets..."
            autofocus
          />

          <template v-if="tree.length">
            <div
              class="flex-1 overflow-y-auto rounded bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-2"
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
                      @click.stop="open = false"
                    />
                    <!-- <UIcon
                      :name="category.icon"
                      class="text-xl"
                    />
                    <span>{{ category.name }}</span>
                   -->
                  </div>
                  <ul class="ml-6 mt-1 flex flex-col gap-1">
                    <UButton
                      v-for="widget in category.widgets"
                      :key="widget.id"
                      variant="ghost"
                      class="flex text-start items-start gap-2 py-1 px-2  grow"
                      :to="widget.to"
                      @click.stop="open = false"
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
        </div>
      </template>
    </UModal>
    <!-- <USelect
      v-model="locale"
      color="primary"
      variant="soft"
      class="w-48"
      size="xl"
      :items="formatedLocales"
    /> -->

    <UButton
      class="hidden xs:flex"
      trailing-icon="mdi:github"
      color="primary"
      variant="soft"
      size="xl"
      to="https://github.com/WIKA-Group/iiot_toolbox"
      target="_blank"
      label="Github"
    />
    <UButton
      class="xs:hidden"
      trailing-icon="mdi:github"
      color="primary"
      variant="soft"
      size="xl"
      to="https://github.com/WIKA-Group/iiot_toolbox"
      target="_blank"
    />
    <UButton
      :icon="isDark ? 'mdi:weather-sunny' : 'mdi:weather-night'"
      color="primary"
      variant="soft"
      size="xl"
      @click="isDark = !isDark"
    />
  </div>
</template>
