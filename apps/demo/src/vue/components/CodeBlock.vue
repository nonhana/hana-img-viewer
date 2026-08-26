<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

const props = defineProps<{
  file: string
  code: string
}>()

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
    // Clipboard access denied; leave the button label unchanged.
  }
}

onBeforeUnmount(() => clearTimeout(resetTimer))
</script>

<template>
  <figure class="code-block">
    <figcaption class="code-block__bar">
      <span class="code-block__file">{{ file }}</span>
      <button type="button" class="code-block__copy" @click="copy">
        {{ copied ? 'Copied' : 'Copy' }}
      </button>
    </figcaption>
    <pre class="code-block__body"><code>{{ code }}</code></pre>
  </figure>
</template>
