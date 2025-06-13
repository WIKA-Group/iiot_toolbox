<script setup lang="ts">
const route = useRoute()

const { data } = await useAsyncData(route.path, () => queryCollection('content').path(route.path).first())

if (!data.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Content not found',
  })
}

useSeoMeta({
  title: data.value?.title,
  description: data.value?.description,
})
</script>

<template>
  <div class="w-full flex justify-center">
    <ContentRenderer
      v-if="data"
      class="prose prose-wika lg:prose-lg dark:prose-invert"
      :value="data"
    />
  </div>
</template>
