<script setup lang="ts">
import type { DownlinkResult } from '~/composables/useDownlinkResult'
import type { ProbeAnswer } from '~/utils/tulip2Actions'
import { encodeFrames } from '~/utils/encodeFrames'
import { buildGetConfigurationInput, maxConfigurationId, resolveGetConfigurationBlocks, resolveMainConfiguration, resolveTulip2Actions, writesConfigurationId } from '~/utils/tulip2Actions'

const props = defineProps<{
  encodeDownlink: (input: never) => unknown

  coveredActions?: readonly string[]

  channelLabels?: Readonly<Record<string, string>>
}>()

const { t } = useI18n()

const vocabulary = computed(() => resolveTulip2Actions(props.encodeDownlink))

const action = useRouteQuery<string>('t2Action', '')

const covered = computed(() => props.coveredActions ?? [])

const SELF_HANDLED = ['getConfiguration']

const selfHandled = computed(() =>
  vocabulary.value.needsForm.filter(entry => SELF_HANDLED.includes(entry)),
)

const offered = computed(() => [
  ...vocabulary.value.parameterless,
  ...vocabulary.value.needsForm.filter(entry => covered.value.includes(entry)),
  ...selfHandled.value,
])

const unavailable = computed(() =>
  vocabulary.value.needsForm.filter(entry =>
    !covered.value.includes(entry) && !SELF_HANDLED.includes(entry),
  ),
)

const selected = computed(() =>
  offered.value.includes(action.value) ? action.value : offered.value[0] ?? '',
)

function actionNeedsConfigurationId(value: string): boolean {
  return vocabulary.value.usesConfigurationId.includes(value)
    || vocabulary.value.configurationIdUntested.includes(value)
}

function actionNeedsInput(value: string): boolean {
  return covered.value.includes(value)
    || SELF_HANDLED.includes(value)
    || actionNeedsConfigurationId(value)
}

const directActions = computed(() =>
  offered.value.filter(value => !actionNeedsInput(value)),
)

const actionsWithInputs = computed(() =>
  offered.value.filter(actionNeedsInput),
)

const showsForm = computed(() => covered.value.includes(selected.value))

const showsGetConfiguration = computed(() => selected.value === 'getConfiguration')

const showsAnyForm = computed(() => showsForm.value || showsGetConfiguration.value)

// Probed per action because each form writes the ID differently; the field itself lives in the action header.
const configurationIdAnswer = computed<ProbeAnswer>(() => {
  const encoder = props.encodeDownlink

  if (selected.value === 'configuration') {
    const fields = resolveMainConfiguration(encoder)
    return writesConfigurationId(encoder, {
      deviceAction: 'configuration',
      mainConfiguration: Object.fromEntries(
        fields.map(field => [field.name, field.type === 'boolean' ? true : field.min ?? 1]),
      ),
    })
  }

  if (selected.value === 'getConfiguration') {
    const first = resolveGetConfigurationBlocks(encoder)[0]
    return first ? writesConfigurationId(encoder, { deviceAction: 'getConfiguration', [first]: true }) : 'untested'
  }

  if (vocabulary.value.usesConfigurationId.includes(selected.value)) return 'yes'
  return vocabulary.value.configurationIdUntested.includes(selected.value) ? 'untested' : 'no'
})

const showConfigurationId = computed(() => configurationIdAnswer.value !== 'no')

const configurationId = useRouteQuery<string>('t2ConfigId', '1')

const configurationIdMax = computed(() => {
  if (selected.value === 'getConfiguration') {
    const first = resolveGetConfigurationBlocks(props.encodeDownlink)[0]
    return first ? maxConfigurationId(props.encodeDownlink, buildGetConfigurationInput([first])) : undefined
  }
  return maxConfigurationId(props.encodeDownlink, { deviceAction: selected.value })
})

const { result, publish } = provideDownlinkResult()

function selectAction(value: string) {
  action.value = value
}

watch(selected, (value) => {
  if (value && action.value !== value) action.value = value
}, { immediate: true })

const configurationIdError = computed(() => {
  const parsed = Number(configurationId.value)
  return Number.isInteger(parsed) && parsed >= 1 ? undefined : t('encoder.tulip2.invalidConfigurationId')
})

// Actions with their own form (configuration, getConfiguration) encode inside that form.
function buildResult(): DownlinkResult | undefined {
  const actionName = selected.value
  if (!actionName || showsAnyForm.value) return undefined

  const input: Record<string, unknown> = { deviceAction: actionName }
  if (actionNeedsConfigurationId(actionName)) {
    if (configurationIdError.value) return { hint: configurationIdError.value }
    input.configurationId = Number(configurationId.value)
  }

  return encodeFrames(props.encodeDownlink, undefined, { protocol: 'TULIP2', input })
}

useLiveEncode(buildResult, publish)

// The forms share these query keys, so clearing them here resets whichever form is shown.
const mainValues = useRouteQuery<string>('t2Main', '')
const channelValues = useRouteQuery<string>('t2Chan', '')
const getSelection = useRouteQuery<string>('t2Get', '')

const hasInput = computed(() => configurationId.value !== '1'
  || [mainValues, channelValues, getSelection].some(query => query.value !== ''))

function resetForm() {
  configurationId.value = '1'
  mainValues.value = ''
  channelValues.value = ''
  getSelection.value = ''
}

const directOptions = computed(() => directActions.value.map(value => ({
  value,
  label: t(`encoder.tulip2.action.${value}`),
})))

const optionsWithInputs = computed(() => actionsWithInputs.value.map(value => ({
  value,
  label: t(`encoder.tulip2.action.${value}`),
})))
</script>

<template>
  <SplitPane>
    <template #input>
      <div class="flex flex-col w-full gap-6">
        <template v-if="offered.length">
          <EncoderSection :title="t('encoder.tulip2.actionLabel')">
            <template
              v-if="actionNeedsInput(selected)"
              #actions
            >
              <div class="flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
                <div
                  v-if="showConfigurationId"
                  class="flex items-center gap-2"
                >
                  <label
                    for="t2-config-id"
                    class="flex items-center gap-1 text-sm text-muted"
                  >
                    {{ t('encoder.tulip2.configurationId') }}
                    <FieldProblem
                      v-if="configurationIdError"
                      :message="configurationIdError"
                    />
                    <UPopover arrow>
                      <UButton
                        icon="mdi:help-circle"
                        size="xs"
                        variant="link"
                        class="p-0"
                        :aria-label="t('encoder.tulip2.configurationIdHelpLabel')"
                      />
                      <template #content>
                        <div class="max-w-md p-2">
                          {{ configurationIdAnswer === 'yes'
                            ? t('encoder.tulip2.configurationIdHelp')
                            : t('encoder.tulip2.configurationIdHelpUnverified') }}
                        </div>
                      </template>
                    </UPopover>
                  </label>
                  <ClearableInput
                    id="t2-config-id"
                    v-model="configurationId"
                    size="sm"
                    class="w-24"
                    :block="false"
                    :clearable="false"
                    :min="1"
                    :max="configurationIdMax"
                    :color="configurationIdError ? 'error' : undefined"
                  />
                </div>
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  icon="mdi:restore"
                  :label="t('encoder.reset')"
                  :disabled="!hasInput"
                  @click="resetForm"
                />
              </div>
            </template>
            <ActionPicker
              :direct="directOptions"
              :with-inputs="optionsWithInputs"
              :selected="selected"
              :direct-label="t('encoder.tulip2.directActionsLabel')"
              :inputs-label="t('encoder.tulip2.actionsWithInputsLabel')"
              @select="selectAction"
            />
          </EncoderSection>

          <EncoderSection
            v-if="showsAnyForm"
            class="border-t border-default pt-6"
          >
            <div
              v-if="showsForm"
            >
              <slot
                name="form"
                :action="selected"
              />
            </div>

            <div
              v-if="showsGetConfiguration"
            >
              <EncodersTulip2GetConfiguration
                :encode-downlink="props.encodeDownlink"
                :channel-labels="channelLabels"
              />
            </div>
          </EncoderSection>
        </template>

        <p
          v-if="unavailable.length"
          class="text-xs text-muted"
        >
          {{ t('encoder.tulip2.needsForm', { actions: unavailable.join(', ') }) }}
        </p>
      </div>
    </template>

    <template #result>
      <FramePanel
        :frames="result.frames"
        :f-port="result.fPort"
        :errors="result.errors"
        :hint="result.hint"
      />
    </template>
  </SplitPane>
</template>
