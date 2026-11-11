<script setup lang="ts">
const devices = deviceList
</script>

<template>
  <div class="not-prose grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(230px,100%),1fr))]">
    <NuxtLink
      v-for="device in devices"
      :key="device.slug"
      :to="`/parsers/${device.slug}`"
      class="group flex flex-col overflow-hidden rounded-sm border border-default bg-default outline-none transition-all
             hover:border-primary hover:shadow-elevation-2
             focus-visible:border-primary focus-visible:shadow-elevation-2
             motion-safe:duration-300 motion-safe:hover:-translate-y-0.5 motion-safe:focus-visible:-translate-y-0.5"
    >

      <div class="flex h-36 items-center justify-center p-4">
        <NuxtImg
          :src="device.img"
          :alt="device.label"
          format="webp"
          loading="lazy"
          class="max-h-full w-auto rounded-xs object-contain transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
        />
      </div>

      <div
        class="p-3 text-center text-sm font-medium text-highlighted transition-colors
               group-hover:text-primary group-focus-visible:text-primary"
      >
        {{ device.label }}
      </div>
    </NuxtLink>
  </div>
</template>
