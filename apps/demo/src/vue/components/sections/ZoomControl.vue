<script setup lang="ts">
import { HanaImgViewer } from 'hana-img-viewer'
import CodeBlock from '../CodeBlock.vue'
import DemoSection from '../DemoSection.vue'

const coverImg = 'https://grey-flowers-r2.caelum.moe/article-covers/202608/23b4cde2-be1a-47f2-b15a-5abe5dacc3af.jpg'
const gardenImg = 'https://pixiv-r2.caelum.moe/129115891.png'

const snippet = `<template>
  <!-- No zoom at all -->
  <HanaImgViewer :enable-zoom="false" src="/covers/summer.jpg" alt="Cover" />

  <!-- Wheel, pinch, and double-click clamped to 1x-3x -->
  <HanaImgViewer :min-zoom="1" :max-zoom="3" src="/photos/garden.png" alt="Garden" />
</template>`
</script>

<template>
  <DemoSection id="zoom-control" index="06" title="Zoom control" :apis="['enableZoom', 'minZoom', 'maxZoom']">
    <template #description>
      Turn zoom off entirely with <code class="demo-code-inline">enableZoom: false</code>, or
      keep it on and clamp the wheel, pinch, and double-click range with
      <code class="demo-code-inline">minZoom</code> and <code class="demo-code-inline">maxZoom</code>.
    </template>
    <figure class="demo-card demo-stage">
      <span class="demo-stage__row">
        <span class="demo-stage__cell">
          <HanaImgViewer class="demo-thumb" :enable-zoom="false" :src="coverImg" alt="Zoom disabled" />
          <code class="demo-code-inline">enableZoom: false</code>
        </span>
        <span class="demo-stage__cell">
          <HanaImgViewer class="demo-thumb" :min-zoom="1" :max-zoom="3" :src="gardenImg" alt="Zoom clamped between 1x and 3x" />
          <code class="demo-code-inline">minZoom: 1 · maxZoom: 3</code>
        </span>
      </span>
      <figcaption class="demo-stage__note">
        Open each one and try the scroll wheel or a double-click.
      </figcaption>
    </figure>
    <CodeBlock file="ZoomControl.vue" :code="snippet" />
  </DemoSection>
</template>
