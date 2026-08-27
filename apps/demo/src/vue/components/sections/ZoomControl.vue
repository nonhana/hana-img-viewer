<script setup lang="ts">
import { HanaImgViewer } from 'hana-img-viewer'
import CodeBlock from '../CodeBlock.vue'
import DemoSection from '../DemoSection.vue'

const coverImg = 'https://grey-flowers-r2.caelum.moe/article-covers/202608/23b4cde2-be1a-47f2-b15a-5abe5dacc3af.jpg'
const gardenImg = 'https://pixiv-r2.caelum.moe/129115891.png'

const snippet = `<template>
  <!-- Default 0.5x-10x zoom -->
  <HanaImgViewer src="/covers/summer.jpg" alt="Cover" />

  <!-- Wheel, pinch, and double-click clamped to 1x-3x -->
  <HanaImgViewer :min-zoom="1" :max-zoom="3" src="/photos/garden.png" alt="Garden" />
</template>`
</script>

<template>
  <DemoSection id="zoom-control" index="06" title="Zoom control" :apis="['minZoom', 'maxZoom']">
    <template #description>
      Zoom is always on. Clamp the wheel, pinch, and double-click range with
      <code class="rounded-[4px] bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em] text-ink-strong">minZoom</code> and <code class="rounded-[4px] bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em] text-ink-strong">maxZoom</code>.
    </template>
    <figure class="m-0 flex flex-col items-center justify-center gap-3.5 rounded-[8px] border border-line-soft bg-surface p-6 shadow-lift">
      <span class="flex w-full flex-wrap justify-center gap-4">
        <span class="flex min-w-0 flex-[1_1_150px] flex-col items-center gap-2.5">
          <HanaImgViewer class="block w-full max-w-[380px]" :src="coverImg" alt="Default zoom range" />
          <code class="rounded-[4px] bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em] text-ink-strong">default: 0.5x · 10x</code>
        </span>
        <span class="flex min-w-0 flex-[1_1_150px] flex-col items-center gap-2.5">
          <HanaImgViewer class="block w-full max-w-[380px]" :min-zoom="1" :max-zoom="3" :src="gardenImg" alt="Zoom clamped between 1x and 3x" />
          <code class="rounded-[4px] bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em] text-ink-strong">minZoom: 1 · maxZoom: 3</code>
        </span>
      </span>
      <figcaption class="m-0 text-center font-mono text-xs tracking-[0.02em] text-ink">
        Open each one and try the scroll wheel or a double-click.
      </figcaption>
    </figure>
    <CodeBlock file="ZoomControl.vue" :code="snippet" />
  </DemoSection>
</template>
