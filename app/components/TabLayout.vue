<script setup lang="ts">

</script>

<template>
  <div
    class="flex flex-col lg:flex-row h-full w-full gap-2"
  >
    <div
      class="lg:h-full w-full"
      :class="[
        $slots.aside ? ' lg:w-2/3' : '',
      ]"
    >
      <slot />
    </div>

    <template v-if="$slots.aside">
      <USeparator
        orientation="vertical"
        class="h-full hidden lg:block"
      />
      <USeparator
        orientation="horizontal"
        class="lg:hidden"
      />
      <div class="h-full flex-1 w-full max-w-full overflow-x-auto">
        <slot name="aside" />
      </div>
    </template>
  </div>
</template>
