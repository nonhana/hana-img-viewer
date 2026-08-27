<script setup lang="ts">
import { HanaImgViewer } from 'hana-img-viewer'
import CodeBlock from '../CodeBlock.vue'
import DemoSection from '../DemoSection.vue'

const artImg = 'https://pixiv-r2.caelum.moe/121909597.png'
const gardenImg = 'https://pixiv-r2.caelum.moe/129115891.png'

const snippet = `<template>
  <!-- Backdrop clicks are ignored; press Escape or the close button -->
  <HanaImgViewer :close-on-backdrop-click="false" src="/a.png" alt="A" />

  <!-- Escape is ignored; click the backdrop or the close button -->
  <HanaImgViewer :close-on-escape="false" src="/b.png" alt="B" />

  <!-- No close button; backdrop and Escape still close -->
  <HanaImgViewer :show-close-button="false" src="/c.png" alt="C" />
</template>`
</script>

<template>
  <DemoSection
    id="close-behavior"
    index="07"
    title="Close behavior"
    :apis="['closeOnBackdropClick', 'closeOnEscape', 'showCloseButton']"
  >
    <template #description>
      All three escape hatches are opt-out: backdrop click, Escape, and the corner
      <code class="rounded-[4px] bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em] text-ink-strong">showCloseButton</code>. The left viewer ignores
      backdrop clicks; the middle one ignores Escape; the right one hides the close
      button.
    </template>
    <figure class="m-0 flex flex-col items-center justify-center gap-3.5 rounded-[8px] border border-line-soft bg-surface p-6 shadow-lift">
      <span class="flex w-full flex-wrap justify-center gap-4">
        <span class="flex min-w-0 flex-[1_1_150px] flex-col items-center gap-2.5">
          <HanaImgViewer
            class="block w-full max-w-[380px]"
            :close-on-backdrop-click="false"
            :src="artImg"
            alt="Closes with Escape or the close button"
          />
          <code class="rounded-[4px] bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em] text-ink-strong">closeOnBackdropClick: false</code>
        </span>
        <span class="flex min-w-0 flex-[1_1_150px] flex-col items-center gap-2.5">
          <HanaImgViewer
            class="block w-full max-w-[380px]"
            :close-on-escape="false"
            :src="gardenImg"
            alt="Closes with a backdrop click or the close button"
          />
          <code class="rounded-[4px] bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em] text-ink-strong">closeOnEscape: false</code>
        </span>
        <span class="flex min-w-0 flex-[1_1_150px] flex-col items-center gap-2.5">
          <HanaImgViewer
            class="block w-full max-w-[380px]"
            :show-close-button="false"
            :src="artImg"
            alt="Closes with the backdrop or Escape only"
          />
          <code class="rounded-[4px] bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em] text-ink-strong">showCloseButton: false</code>
        </span>
      </span>
      <figcaption class="m-0 text-center font-mono text-xs tracking-[0.02em] text-ink">
        Try the wrong close gesture first — nothing happens.
      </figcaption>
    </figure>
    <CodeBlock file="CloseBehavior.vue" :code="snippet" />
  </DemoSection>
</template>
