<script setup lang="ts">
import { HanaImgViewer } from 'hana-img-viewer'
import { ref } from 'vue'
import CodeBlock from '../CodeBlock.vue'
import DemoSection from '../DemoSection.vue'

const gardenImg = 'https://pixiv-r2.caelum.moe/129115891.png'
const open = ref(false)

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
      Bind <code
        class="
          rounded-sm bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em]
          text-ink-strong
        "
      >v-model:open</code> to drive visibility from outside.
      The viewer never flips state on its own — it emits
      <code
        class="
          rounded-sm bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em]
          text-ink-strong
        "
      >update:open</code> and waits for your state to change, so
      your ref stays the single source of truth.
    </template>
    <figure
      class="
        m-0 flex flex-col items-center justify-center gap-3.5 rounded-lg border
        border-line-soft bg-surface p-6 shadow-lift
      "
    >
      <button
        type="button" class="
          inline-flex cursor-pointer items-center gap-2 rounded-lg border
          border-line bg-surface px-4 py-2 font-mono text-[13px] text-ink-strong
          select-none
          motion-safe:[transition:background-color_300ms_ease-out,border-color_300ms_ease-out,color_300ms_ease-out,transform_300ms_ease-out]
          motion-safe:hover:border-hana-blue-150
          motion-safe:hover:bg-hana-blue-150 motion-safe:hover:text-hana-blue
          motion-safe:active:scale-[0.95]
        " @click="open = true"
      >
        Open from the outside
      </button>
      <HanaImgViewer v-model:open="open" class="block w-full max-w-95" :src="gardenImg" alt="Artwork 129115891" />
      <figcaption class="m-0 text-center font-mono text-xs tracking-[0.02em] text-ink">
        open: {{ open }}
      </figcaption>
    </figure>
    <CodeBlock file="ControlledState.vue" :code="snippet" />
  </DemoSection>
</template>
