<script setup lang="ts">
type Props = {
  data?: object | unknown[]
  warnings?: string[]
  errors?: string[]
  label?: string
}

const props = defineProps<Props>()

const stringifiedResult = computed(() => {
  return props.data ? JSON.stringify(props.data, null, 2) : ''
})
</script>

<template>
  <div class="flex flex-col overflow-x-auto">
    <label class="text-sm font-medium text-toned">{{ label ?? 'Result' }}</label>
    <Code
      v-if="data"
      class="w-full"
      :code="stringifiedResult"
    />
    <div
      v-if="(errors && errors.length) || (warnings && warnings.length)"
      class="flex flex-col gap-1 mt-2"
    >
      <div
        v-if="errors && errors.length"
        class="text-error text-xs"
      >
        <span class="font-semibold">Errors:</span>
        <ul class="list-disc pl-5">
          <li
            v-for="(err, idx) in errors"
            :key="'err-' + idx"
          >
            {{ err }}
          </li>
        </ul>
      </div>
      <div
        v-if="warnings && warnings.length"
        class="text-warning text-xs"
      >
        <span class="font-semibold">Warnings:</span>
        <ul class="list-disc pl-5">
          <li
            v-for="(warn, idx) in warnings"
            :key="'warn-' + idx"
          >
            {{ warn }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
