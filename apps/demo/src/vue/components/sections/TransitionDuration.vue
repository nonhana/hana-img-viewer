<script setup lang="ts">
import { HanaImgViewer } from 'hana-img-viewer'
import CodeBlock from '../CodeBlock.vue'
import DemoSection from '../DemoSection.vue'

const coverImg = 'https://grey-flowers-r2.caelum.moe/article-covers/202608/23b4cde2-be1a-47f2-b15a-5abe5dacc3af.jpg'
const gardenImg = 'https://pixiv-r2.caelum.moe/129115891.png'

const snippet = `<template>
  <!-- Default 300ms open/close FLIP -->
  <HanaImgViewer src="/covers/summer.jpg" alt="Cover" />

  <!-- Longer, smoother open/close animation -->
  <HanaImgViewer :transition-duration="600" src="/photos/garden.png" alt="Garden" />
</template>`
</script>

<template>
  <DemoSection
    id="transition-duration"
    index="08"
    title="Transition duration"
    :apis="['transitionDuration']"
  >
    <template #description>
      The open and close FLIP runs for
      <code class="rounded-[4px] bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em] text-ink-strong">transitionDuration</code> milliseconds. The
      left viewer keeps the 300&nbsp;ms default; the right one stretches the
      animation to 600&nbsp;ms.
    </template>
    <figure class="m-0 flex flex-col items-center justify-center gap-3.5 rounded-[8px] border border-line-soft bg-surface p-6 shadow-lift">
      <span class="flex w-full flex-wrap justify-center gap-4">
        <span class="flex min-w-0 flex-[1_1_150px] flex-col items-center gap-2.5">
          <HanaImgViewer class="block w-full max-w-[380px]" :src="coverImg" alt="Default 300ms transition" />
          <code class="rounded-[4px] bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em] text-ink-strong">default: 300ms</code>
        </span>
        <span class="flex min-w-0 flex-[1_1_150px] flex-col items-center gap-2.5">
          <HanaImgViewer
            class="block w-full max-w-[380px]"
            :transition-duration="600"
            :src="gardenImg"
            alt="600ms transition"
          />
          <code class="rounded-[4px] bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em] text-ink-strong">transitionDuration: 600</code>
        </span>
      </span>
      <figcaption class="m-0 text-center font-mono text-xs tracking-[0.02em] text-ink">
        Open and close each one — the right viewer animates noticeably slower.
      </figcaption>
    </figure>
    <CodeBlock file="TransitionDuration.vue" :code="snippet" />
  </DemoSection>
</template>
