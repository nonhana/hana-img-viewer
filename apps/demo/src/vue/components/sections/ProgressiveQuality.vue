<script setup lang="ts">
import { HanaImgViewer } from 'hana-img-viewer'
import CodeBlock from '../CodeBlock.vue'
import DemoSection from '../DemoSection.vue'

const coverImg = 'https://grey-flowers-r2.caelum.moe/article-covers/202608/23b4cde2-be1a-47f2-b15a-5abe5dacc3af.jpg'
const artImg = 'https://pixiv-r2.caelum.moe/121909597.png'

const snippet = `<script setup lang="ts">
import { HanaImgViewer } from 'hana-img-viewer'

const thumb = '/covers/summer-320w.jpg'
const fullRes = '/covers/summer-2400w.png'
<\/script>

<template>
  <HanaImgViewer :src="thumb" :preview-src="fullRes" alt="Summer cover" />
</template>`
</script>

<template>
  <DemoSection id="progressive-quality" index="02" title="Progressive quality" :apis="['previewSrc']">
    <template #description>
      Keep <code
        class="
          rounded-sm bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em]
          text-ink-strong
        "
      >src</code> light and pass the full-quality file as
      <code
        class="
          rounded-sm bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em]
          text-ink-strong
        "
      >previewSrc</code>. The overlay opens instantly with the
      thumbnail, then swaps in the high-res image the moment it finishes loading — no spinner,
      no layout shift.
    </template>
    <figure
      class="
        m-0 flex flex-col items-center justify-center gap-3.5 rounded-lg border
        border-line-soft bg-surface p-6 shadow-lift
      "
    >
      <HanaImgViewer
        class="block w-full max-w-95"
        :src="coverImg"
        :preview-src="artImg"
        alt="Cover that upgrades to a high-res artwork"
      />
      <figcaption class="m-0 text-center font-mono text-xs tracking-[0.02em] text-ink">
        Open it and watch the image sharpen in place.
      </figcaption>
    </figure>
    <CodeBlock file="ProgressiveQuality.vue" :code="snippet" />
  </DemoSection>
</template>
