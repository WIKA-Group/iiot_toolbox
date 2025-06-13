<script setup lang="ts">
type Decoder = (input: { bytes: string, fPort: number }) => { data: object, warnings?: string[] } | { errors: string[] }

type OutputSuccess = { data: object, warnings?: string[] }
type OutputFailure = { errors: string[] }
type OutputWarnings = string[]
type OutputErrors = string[]
type Output = OutputSuccess | OutputFailure

type Props = {
  decodeHexUplink: Decoder
}

const props = defineProps<Props>()

const hexString = useRouteQuery('hexString', '')

const decodeError = ref<OutputErrors | undefined>(undefined)
const decodeWarning = ref<OutputWarnings | undefined>(undefined)
const decodedResult = ref<Output | undefined>(undefined)
const decodedData = computed<object | unknown[] | undefined>(() => {
  if (!decodedResult.value) return undefined
  if ('data' in decodedResult.value) {
    return decodedResult.value.data
  }
  return undefined
})

function decodeHexString() {
  if (!hexString.value) {
    decodedResult.value = undefined
    decodeError.value = undefined
    return
  }
  decodeError.value = undefined
  // Use parser's decodeHexUplink for hex string
  // roundingDecimals is now handled outside, so do not set it here
  const result = props.decodeHexUplink({ bytes: hexString.value, fPort: 1 })
  decodedResult.value = result
  if ('errors' in result) {
    decodeError.value = result.errors as OutputErrors
  }
  else {
    decodeError.value = undefined
  }

  if ('warnings' in result) {
    decodeWarning.value = result.warnings as OutputWarnings
  }
  else {
    decodeWarning.value = undefined
  }
}
watch(hexString, () => decodeHexString(), {
  immediate: true,
})

defineExpose({
  decodeHexString,
})
</script>

<template>
  <TabLayout>
    <div class="flex flex-col w-full h-full gap-4">
      <div class="flex flex-col gap-2 grow">
        <UFormField label="Hexstring">
          <UTextarea
            v-model="hexString"
            class="max-w-96 w-full font-mono"
            :maxrows="3"

            autoresize
            placeholder="Paste your hex string here"
          />
        </UFormField>
      </div>
    </div>
    <template
      v-if="decodedResult"
      #aside
    >
      <DisplayResult
        :data="decodedData"
        :errors="decodeError"
        :warnings="decodeWarning"
        label="Decoded JSON"
      />
    </template>
  </TabLayout>
</template>
