<script setup lang="ts">
import { HanaImgViewer } from 'hana-img-viewer'
import CodeBlock from '../CodeBlock.vue'
import DemoSection from '../DemoSection.vue'

const artImg = 'https://pixiv-r2.caelum.moe/121909597.png'

const snippet = `<script setup lang="ts">
import { HanaImgViewer } from 'hana-img-viewer'
<\/script>

<template>
  <HanaImgViewer
    src="https://pixiv-r2.caelum.moe/121909597.png"
    alt="Artwork 121909597"
  />
</template>`
</script>

<template>
  <DemoSection id="basic-usage" index="01" title="Basic usage" :apis="['src', 'alt']">
    <template #description>
      Point <code class="demo-code-inline">src</code> at an image and the thumbnail becomes a
      full viewer: click it to open, scroll or double-click to zoom, pinch on touch, drag to
      pan. Escape or a backdrop click closes it again.
    </template>
    <figure class="demo-card demo-stage">
      <HanaImgViewer class="demo-thumb" :src="artImg" alt="Artwork 121909597" />
      <figcaption class="demo-stage__note">
        Click the artwork to open the viewer.
      </figcaption>
    </figure>
    <CodeBlock file="BasicUsage.vue" :code="snippet" />
  </DemoSection>
</template>
