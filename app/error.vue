<script setup lang="ts">
useHead({
  title: 'WIKA - IIoT Toolbox',
  meta: [
    {
      name: 'description',
      content: 'WIKA IIoT Toolbox - Toolbox for WIKA IIoT applications and devices',
    },
  ],
})

const { setLocale } = useI18n()
await setLocale('en')
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
        <div class="flex flex-col w-full gap-2 p-8 items-center justify-center">
          Seems like you landed here by mistake. This page does not exist or has been moved.
          <UButton
            class="w-fit"
            color="primary"
            variant="solid"
            to="/"
            icon="mdi:home"
          >
            Go to Home
          </UButton>
        </div>
      </div>
    </div>
  </UApp>
</template>
