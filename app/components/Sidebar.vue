<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

// Build navigation items: each category is a group, widgets are children
const items = computed<NavigationMenuItem[]>(() =>
  categories.map(category => ({
    label: category.name,
    icon: category.icon,
    to: category.to,
    children: widgets
      .filter(w => w.category === category.name)
      .map(widget => ({
        label: widget.name,
        description: widget.description,
        to: widget.to,
        // Optionally, you could add a click handler or route here
      })),
  } satisfies NavigationMenuItem)),
)
</script>

<template>
  <div class="py-2 flex flex-col h-full gap-2">
    <div class="w-full flex flex-col gap-2 justify-center items-center px-2">
      <NuxtLink
        to="https://www.wika.com/"
        target="_blank"
        external
      >
        <NuxtImg
          src="/WIKA.png"
          alt="WIKA Logo"
          quality="10"
        />
      </NuxtLink>
      <UButton
        variant="link"
        to="https://iiot.wika.com/de/iiot.WIKA"
        target="_blank"
        external
        trailing-icon="mdi:launch"
      >
        WIKA IIoT Solutions
      </UButton>
      <UButton
        variant="link"
        to="https://www.wika.com/en-en/iiot_products.WIKA"
        target="_blank"
        external
        trailing-icon="mdi:launch"
      >
        WIKA IIoT Products
      </UButton>
    </div>
    <USeparator
      class="w-full"
      color="primary"
    />
    <div class="grow truncate overflow-y-auto w-full px-2">
      <UNavigationMenu
        orientation="vertical"
        :items="items"
      />
    </div>

    <USeparator
      class="w-full"
      color="primary"
    />

    <div class="w-full flex justify-center items-center px-2">
      <UButton
        variant="link"
        to="https://www.wika.com/en-en/legal_notice.WIKA"
        target="_blank"
        external
        trailing-icon="mdi:launch"
      >
        Imprint
      </UButton>
    </div>
  </div>
</template>
