<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui'
import { NETRIS2Parser } from '@w2a-iiot/parsers'

const parser = NETRIS2Parser()

const { widget } = useWidget()

const accordionItem = {
  label: 'Parser configuration',
  icon: 'mdi:settings',
  description: 'Configure the Netris2 parser for your device.',
} as const satisfies AccordionItem

const roundingDecimals = useRouteQuery('roundingDecimals', 4, { transform: Number })

async function downloadParser() {
  // Dynamically import parser code when downloading
  let code = await import('../../../node_modules/@w2a-iiot/raw-javascript-parsers/dist/NETRIS2/index.js?raw').then(m => m.default)
  code += '\n'
  code += `\n// Adjust rounding decimals\nadjustRoundingDecimals(${roundingDecimals.value});\n`
  const blob = new Blob([code], { type: 'text/javascript' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${widget.value?.name ?? 'parser'}.js`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const decoder = useTemplateRef('decoder')

onMounted(() => {
  watchEffect(() => {
    parser.adjustRoundingDecimals(roundingDecimals.value)
    decoder.value?.decodeHexString()
  })
})
</script>

<template>
  <div class="w-full h-full flex flex-col">
    <!-- TODO: decide if we input decimals/channels as props or if we expose the decode function or if we only emit pasted hexstring and input result -->
    <UAccordion
      class="grow mb-4"
      :ui="{
        item: 'last:border-b border-primary',
      }"
      :items="[accordionItem]"
    >
      <template #body>
        <div class="flex flex-col gap-2">
          <UFormField
            label="Rounding Decimals"
            required
          >
            <UInput
              v-model.number="roundingDecimals"
              type="number"
              class="w-64"
              :min="0"
              placeholder="Decimals"
            />
          </UFormField>
          <UButton
            color="primary"
            variant="solid"
            class="w-fit"
            @click="downloadParser()"
          >
            Download parser
          </UButton>
        </div>
      </template>
    </UAccordion>
    <ParserTabs
      class="w-full h-full"
    >
      <template #decoding>
        <Decoder
          ref="decoder"
          :decode-hex-uplink="parser.decodeHexUplink"
        />
      </template>
      <template #encoding>
        <NETRIS2Encoder
          :encode-downlink="parser.encodeDownlink"
        />
      </template>
    </ParserTabs>
  </div>
</template>
