<script setup lang="ts" generic="Row extends { key: string, label: string, formula?: string, problem?: string }">
defineProps<{
  rows: Row[]
  columns: string[]
}>()

defineSlots<{ cell: (props: { row: Row, columnIndex: number }) => unknown }>()
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <div
      v-for="row in rows"
      :key="row.key"
      class="border-l-2 border-primary/40 ps-3"
    >
      <!-- Header height is fixed so the formula appearing does not shift the fields. -->
      <div class="flex min-h-5 items-baseline justify-between gap-2">
        <OverlineLabel>{{ row.label }}</OverlineLabel>
        <span
          class="flex items-center gap-1 text-sm font-medium"
          :class="row.problem ? 'text-error' : 'text-highlighted'"
        >
          {{ row.formula }}
          <FieldProblem
            v-if="row.problem"
            :message="row.problem"
          />
        </span>
      </div>
      <div class="grid gap-x-4 sm:grid-cols-2">
        <slot
          v-for="(column, columnIndex) in columns"
          :key="column"
          name="cell"
          :row="row"
          :column-index="columnIndex"
        />
      </div>
    </div>
  </div>
</template>
