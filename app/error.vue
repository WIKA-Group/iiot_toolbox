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

const { appVersion, parserVersion } = useRuntimeConfig().public
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
        <div class="frame flex flex-col grow pt-8 pb-6 gap-2 md:pt-12 md:pb-8">
          <div class="flex flex-col w-full gap-2 p-8 items-center justify-center">
            Seems like you landed here by mistake. This page does not exist or has been moved.
            <UButton
              class="w-fit"
              color="primary"
              variant="solid"
              to="/"
            >
              Go to Home
            </UButton>
          </div>
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
