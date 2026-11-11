<script setup lang="ts">
import type { DownlinkResult } from '~/composables/useDownlinkResult'
import type { ProbeAnswer } from '~/utils/tulip2Actions'
import { encodeFrames } from '~/utils/encodeFrames'
import { buildGetConfigurationInput, resolveGetConfigurationBlocks, writesConfigurationId } from '~/utils/tulip2Actions'

const props = defineProps<{
  encodeDownlink: (input: never) => unknown

  channelLabels?: Readonly<Record<string, string>>
}>()

const { t } = useI18n()

const blocks = computed(() => resolveGetConfigurationBlocks(props.encodeDownlink))

const configurationIdAnswer = computed<ProbeAnswer>(() => {
  const first = blocks.value[0]
  if (!first) return 'untested'
  return writesConfigurationId(props.encodeDownlink, { deviceAction: 'getConfiguration', [first]: true })
})

const showConfigurationId = computed(() => configurationIdAnswer.value !== 'no')

const configurationId = useRouteQuery<string>('t2ConfigId', '1')

const selection = useRouteQuery<string>('t2Get', '')

const chosen = computed(() => new Set(selection.value.split(',').filter(Boolean)))

const isChosen = (name: string) => chosen.value.has(name)

interface BlockGroup {
  path: string
  children: string[]
}

const groups = computed<BlockGroup[]>(() => blocks.value
  .filter(block => !block.includes('.'))
  .map(path => ({ path, children: blocks.value.filter(block => block.startsWith(`${path}.`)) })))

// A whole channel is the same request as all of its parts; a single part would only repeat the parent.
const shownChildren = (group: BlockGroup) => group.children.length > 1 ? group.children : []

function parentState(group: BlockGroup): boolean | 'indeterminate' {
  if (chosen.value.has(group.path)) return true
  const count = group.children.filter(child => chosen.value.has(child)).length
  if (!count) return false
  return count === group.children.length ? true : 'indeterminate'
}

const childChosen = (group: BlockGroup, child: string) => chosen.value.has(group.path) || chosen.value.has(child)

function blockLabel(path: string): string {
  const [channel, detail] = path.split('.')
  if (!channel || !/^channel\d+$/.test(channel)) return t(`encoder.tulip2.block.${path}`)
  if (detail) return t(`encoder.tulip2.block.${detail}`)

  return props.channelLabels?.[channel]
    ?? t('encoder.tulip2.block.channel', { n: Number(channel.replace('channel', '')) + 1 })
}

function commit(next: Set<string>) {
  selection.value = blocks.value.filter(block => next.has(block)).join(',')
}

function toggleBlock(path: string, on: boolean) {
  const next = new Set(chosen.value)
  for (const entry of next) {
    if (entry === path || entry.startsWith(`${path}.`)) next.delete(entry)
  }
  if (on) next.add(path)
  commit(next)
}

function toggleChild(group: BlockGroup, child: string, on: boolean) {
  const next = new Set(chosen.value)
  // Expand a chosen whole channel into its parts so one of them can be switched off.
  if (next.delete(group.path)) {
    for (const part of group.children) next.add(part)
  }
  if (on) next.add(child)
  else next.delete(child)

  if (group.children.every(part => next.has(part))) {
    for (const part of group.children) next.delete(part)
    next.add(group.path)
  }
  commit(next)
}

const publish = useDownlinkResult()

const configurationIdError = computed(() => {
  const parsed = Number(configurationId.value)
  return Number.isInteger(parsed) && parsed >= 1 ? undefined : t('encoder.tulip2.invalidConfigurationId')
})

function buildResult(): DownlinkResult {
  const selected = blocks.value.filter(isChosen)

  if (!selected.length) return { hint: t('encoder.tulip2.getMissing') }

  const input = buildGetConfigurationInput(selected)

  if (showConfigurationId.value) {
    if (configurationIdError.value) return { hint: configurationIdError.value }
    input.configurationId = Number(configurationId.value)
  }

  return encodeFrames(props.encodeDownlink, undefined, { protocol: 'TULIP2', input })
}

useLiveEncode(buildResult, publish)
</script>

<template>
  <EncoderSection
    :level="3"
    boxed
    :title="t('encoder.tulip2.getBlocksLabel')"
  >
    <div class="flex flex-col gap-3">
      <template
        v-for="group in groups"
        :key="group.path"
      >
        <UCheckbox
          :id="`t2get-${group.path}`"
          :model-value="parentState(group)"
          :label="blockLabel(group.path)"
          @update:model-value="value => toggleBlock(group.path, value === true)"
        />
        <div
          v-if="shownChildren(group).length"
          class="-mt-1 ms-6 flex flex-col gap-2"
        >
          <UCheckbox
            v-for="child in shownChildren(group)"
            :id="`t2get-${child}`"
            :key="child"
            :model-value="childChosen(group, child)"
            :label="blockLabel(child)"
            @update:model-value="value => toggleChild(group, child, value === true)"
          />
        </div>
      </template>
    </div>
  </EncoderSection>
</template>
