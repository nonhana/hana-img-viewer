<script setup lang="ts">
import { HanaImgViewer } from 'hana-img-viewer'
import { ref } from 'vue'
import CodeBlock from '../CodeBlock.vue'
import DemoSection from '../DemoSection.vue'

const gardenImg = 'https://pixiv-r2.caelum.moe/129115891.png'
const open = ref(false)

// Joined per line: the prerender guard rejects SSR bundles containing bare
// `import ... from 'vue'` lines, which a template literal would emit verbatim.
const snippet = [
  '<script setup lang="ts">',
  'import { HanaImgViewer } from \'hana-img-viewer\'',
  'import { ref } from \'vue\'',
  '',
  'const open = ref(false)',
  '<\/script>',
  '',
  '<template>',
  '  <button type="button" @click="open = true">Open from the outside</button>',
  '  <HanaImgViewer v-model:open="open" src="/photos/garden.png" alt="Garden" />',
  '  <p>open: {{ open }}</p>',
  '</template>',
].join('\n')
</script>

<template>
  <DemoSection id="controlled-state" index="03" title="Controlled state" :apis="['v-model:open', 'update:open']">
    <template #description>
      Bind <code class="demo-code-inline">v-model:open</code> to drive visibility from outside.
      The viewer never flips state on its own — it emits
      <code class="demo-code-inline">update:open</code> and waits for your state to change, so
      your ref stays the single source of truth.
    </template>
    <figure class="demo-card demo-stage">
      <button type="button" class="demo-button" @click="open = true">
        Open from the outside
      </button>
      <HanaImgViewer v-model:open="open" class="demo-thumb" :src="gardenImg" alt="Artwork 129115891" />
      <figcaption class="demo-stage__note">
        open: {{ open }}
      </figcaption>
    </figure>
    <CodeBlock file="ControlledState.vue" :code="snippet" />
  </DemoSection>
</template>
