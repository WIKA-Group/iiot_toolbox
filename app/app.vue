<script setup lang="ts">
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
</script>

<template>
  <UApp>
    <div class="flex w-dvw h-dvh">
      <Sidebar
        class="h-full w-64 hidden md:flex"
      />
      <USeparator
        orientation="vertical"
        class="h-full"
        color="primary"
      />
      <div class="flex flex-col grow h-full overflow-hidden px-4 py-2 gap-2">
        <Header class="w-full my-2" />
        <NuxtPage />
      </div>
    </div>
  </UApp>
</template>
