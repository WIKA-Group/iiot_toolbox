<script setup lang="ts">
// Time in seconds
const model = defineModel<number | undefined>()

type Props = {
  max?: number
}

// TODO: remove the inital setting to fit the min as this may result in unexpected behavior (e.g. empty and user wants to set to 1h but it sets to 1m as it is min)

const props = defineProps<Props>()

const doesModelHaveValue = computed(() => typeof model.value === 'number' && !isNaN(model.value))

function clamp(val: number) {
  if (props.max !== undefined && val > props.max) return props.max
  return val
}

const hours = computed({
  get() {
    // If model is undefined, field is empty
    return doesModelHaveValue.value ? Math.floor(model.value! / 3600) : undefined
  },
  set(value) {
    if (!doesModelHaveValue.value) {
      // Only clamp to max, not min
      const total = (value ?? 0) * 3600
      model.value = props.max !== undefined ? Math.min(total, props.max) : total
      return
    }
    const m = model.value!
    const min = Math.floor((m % 3600) / 60)
    const sec = m % 60
    const total = (value ?? 0) * 3600 + min * 60 + sec
    model.value = clamp(total)
  },
})

const minutes = computed({
  get() {
    if (!doesModelHaveValue.value) return undefined
    return Math.floor((model.value! % 3600) / 60)
  },
  set(value) {
    if (!doesModelHaveValue.value) {
      // Only clamp to max, not min
      const total = (value ?? 0) * 60
      model.value = props.max !== undefined ? Math.min(total, props.max) : total
      return
    }
    const m = model.value!
    const hr = Math.floor(m / 3600)
    const sec = m % 60
    const total = (value ?? 0) * 60 + sec + hr * 3600
    model.value = clamp(total)
  },
})

const seconds = computed({
  get() {
    if (!doesModelHaveValue.value) return undefined
    return model.value! % 60
  },
  set(value) {
    if (!doesModelHaveValue.value) {
      // Only clamp to max, not min
      const total = value ?? 0
      model.value = props.max !== undefined ? Math.min(total, props.max) : total
      return
    }
    const m = model.value!
    const hr = Math.floor(m / 3600)
    const min = Math.floor((m % 3600) / 60)
    const total = (value ?? 0) + min * 60 + hr * 3600
    model.value = clamp(total)
  },
})

const maxHours = computed(() => {
  if (props.max === undefined) return undefined
  return Math.floor(props.max / 3600)
})

const maxMinutes = computed(() => {
  if (props.max === undefined) return 59
  // If hours is at its max, restrict minutes so total doesn't exceed max
  const currentHours = hours.value ?? 0
  const maxForCurrentHours = Math.floor((props.max - currentHours * 3600) / 60)
  return Math.min(59, maxForCurrentHours)
})

const maxSeconds = computed(() => {
  if (props.max === undefined) return 59
  const currentHours = hours.value ?? 0
  const currentMinutes = minutes.value ?? 0
  const maxForCurrentHM = props.max - currentHours * 3600 - currentMinutes * 60
  return Math.min(59, Math.max(0, maxForCurrentHM))
})
</script>

<template>
  <div class="flex gap-2">
    <div class="text-center grow">
      <UInputNumber
        v-model="hours"
        class="min-w-16 w-full"
        :min="0"
        :max="maxHours"
        orientation="vertical"
      />
      Hours
    </div>

    <div class="text-center grow">
      <UInputNumber
        v-model="minutes"
        class="min-w-16 w-full"
        :min="0"
        :max="maxMinutes"
        orientation="vertical"
      />
      Minutes
    </div>

    <div class="text-center grow">
      <UInputNumber
        v-model="seconds"
        class="min-w-16 w-full"
        :min="0"
        :max="maxSeconds"
        orientation="vertical"
      />
      Seconds
    </div>
  </div>
</template>
