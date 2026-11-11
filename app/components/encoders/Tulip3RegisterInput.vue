<script setup lang="ts">
import type { RegisterInfo } from '~/utils/tulip3Registers'
import { parseSet, serializeSet, setMembers } from '~/utils/tulip3Sets'

const props = defineProps<{
  register: RegisterInfo
  unit?: string
  memberLabels?: Record<string, string>
}>()

const model = defineModel<string>({ default: '' })

const { t } = useI18n()

const booleanItems = computed(() => [
  { label: t('encoder.tulip2.booleanTrue'), value: 'true' },
  { label: t('encoder.tulip2.booleanFalse'), value: 'false' },
])

const stateItems = computed(() => [
  { label: t('encoder.tulip2.booleanTrue'), value: 'on' },
  { label: t('encoder.tulip2.booleanFalse'), value: 'off' },
])

const members = computed(() => setMembers(props.register))

const decided = computed(() => parseSet(model.value))

const stateOf = (member: string) => {
  const state = decided.value.get(member)
  return state === undefined ? '' : state ? 'on' : 'off'
}

// Once one entry is decided the others are required, because an unset entry would be switched off.
const isMissing = (member: string) => decided.value.size > 0 && !decided.value.has(member)

function memberLabel(member: string): string {
  if (props.register.facts.access === 'readWrite' && props.register.facts.control === 'flags') {
    return t(`encoder.tulip3.alarmFlag.${member}`)
  }
  return props.memberLabels?.[member] ?? member
}

function setMember(member: string, state: string) {
  const next = new Map(decided.value)
  if (state === '') next.delete(member)
  else next.set(member, state === 'on')
  model.value = serializeSet(next, members.value)
}
</script>

<template>
  <NumberField
    v-if="register.facts.access === 'readWrite' && (register.facts.control === 'number' || register.facts.control === 'integer')"
    v-model="model"
    :min="register.facts.min"
    :max="register.facts.max"
    :integer="register.facts.control === 'integer'"
    :unit="unit"
    :fallback-placeholder="t('encoder.tulip3.leaveEmpty')"
  />

  <OptionalSelect
    v-else-if="register.facts.access === 'readWrite' && register.facts.control === 'select'"
    v-model="model"
    :items="register.facts.options.map(option => ({ label: option, value: option }))"
  />

  <OptionalSelect
    v-else-if="register.facts.access === 'readWrite' && register.facts.control === 'boolean'"
    v-model="model"
    :items="booleanItems"
  />

  <div
    v-else-if="members.length"
    class="grid grid-cols-[auto_minmax(0,1fr)] items-center justify-start gap-x-3 gap-y-2 sm:grid-cols-[auto_10rem_auto_10rem]"
  >
    <template
      v-for="(member, index) in members"
      :key="member"
    >
      <span
        class="flex items-center gap-1 text-sm text-default"
        :class="index % 2 === 1 ? 'sm:ms-6' : ''"
      >
        {{ memberLabel(member) }}
        <!-- Always reserved, so the icon appearing does not widen the label column. -->
        <span class="inline-flex size-4 shrink-0 items-center justify-center">
          <FieldProblem
            v-if="isMissing(member)"
            :message="t('encoder.required')"
          />
        </span>
      </span>
      <OptionalSelect
        :model-value="stateOf(member)"
        :items="stateItems"
        :placeholder="t('encoder.select')"
        :color="isMissing(member) ? 'error' : undefined"
        :highlight="isMissing(member)"
        @update:model-value="state => setMember(member, state)"
      />
    </template>
  </div>

  <p
    v-else-if="register.facts.access === 'readWrite' && register.facts.control === 'unenumerable'"
    class="text-xs text-warning"
  >
    {{ t('encoder.tulip3.unenumerable') }}
  </p>
</template>
