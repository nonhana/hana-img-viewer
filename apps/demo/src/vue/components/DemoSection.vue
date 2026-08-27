<script setup lang="ts">
defineProps<{
  id: string
  index: string
  title: string
  apis: string[]
}>()
</script>

<template>
  <section :id="id" class="flex scroll-mt-22 flex-col gap-3">
    <p class="flex flex-wrap items-center gap-2">
      <span class="font-mono text-[11px] tracking-[0.18em] text-ink uppercase">{{ index }}</span>
      <code
        v-for="api in apis" :key="api" class="
          rounded-sm bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em]
          text-ink-strong
        "
      >{{ api }}</code>
    </p>
    <h2 class="text-[28px]">
      <span class="font-normal text-hana-blue-200"># </span>{{ title }}
    </h2>
    <p class="max-w-160 text-[15.5px]">
      <slot name="description" />
    </p>
    <div
      class="
        mt-2.5 grid grid-cols-1 items-stretch gap-5
        min-[861px]:grid-cols-2
      "
    >
      <slot />
    </div>
  </section>
</template>
