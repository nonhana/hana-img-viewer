<script setup lang="ts">
defineProps<{
  id: string
  index: string
  title: string
  apis: string[]
}>()
</script>

<template>
  <section :id="id" class="demo-section">
    <p class="demo-section__eyebrow">
      <span class="demo-meta">{{ index }}</span>
      <code v-for="api in apis" :key="api" class="demo-code-inline">{{ api }}</code>
    </p>
    <h2 class="demo-section__title">
      {{ title }}
    </h2>
    <p class="demo-section__desc">
      <slot name="description" />
    </p>
    <div class="demo-section__grid">
      <slot />
    </div>
  </section>
</template>
