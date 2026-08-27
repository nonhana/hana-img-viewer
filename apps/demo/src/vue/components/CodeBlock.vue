<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { highlightCode } from '../../shared/highlighter'

const props = defineProps<{
  file: string
  code: string
}>()
const html = highlightCode(props.code, props.file)

const copied = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    clearTimeout(resetTimer)
    resetTimer = setTimeout(() => {
      copied.value = false
    }, 1600)
  }
  catch {
  }
}

onBeforeUnmount(() => clearTimeout(resetTimer))
</script>

<template>
  <figure
    class="
      m-0 self-start overflow-hidden rounded-lg border-2 border-primary-400
      bg-primary-100
    "
  >
    <figcaption
      class="
        flex items-center justify-between gap-3 border-b border-line-soft px-3
        py-1.5
      "
    >
      <span class="font-mono text-[11px] tracking-[0.18em] text-ink uppercase">{{ file }}</span>
      <button
        type="button"
        class="
          cursor-pointer rounded-full border border-line bg-surface px-2.5
          py-0.5 font-mono text-[11px] tracking-[0.08em] text-ink
          motion-safe:[transition:background-color_300ms_ease-out,color_300ms_ease-out,border-color_300ms_ease-out]
          motion-safe:hover:border-hana-blue-150
          motion-safe:hover:bg-hana-blue-150 motion-safe:hover:text-hana-blue
        "
        @click="copy"
      >
        {{ copied ? 'Copied' : 'Copy' }}
      </button>
    </figcaption>
    <div v-html="html" />
  </figure>
</template>
