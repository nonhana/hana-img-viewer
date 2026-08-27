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
      <code class="demo-code-inline">transitionDuration</code> milliseconds. The
      left viewer keeps the 300&nbsp;ms default; the right one stretches the
      animation to 600&nbsp;ms.
    </template>
    <figure class="demo-card demo-stage">
      <span class="demo-stage__row">
        <span class="demo-stage__cell">
          <HanaImgViewer class="demo-thumb" :src="coverImg" alt="Default 300ms transition" />
          <code class="demo-code-inline">default: 300ms</code>
        </span>
        <span class="demo-stage__cell">
          <HanaImgViewer
            class="demo-thumb"
            :transition-duration="600"
            :src="gardenImg"
            alt="600ms transition"
          />
          <code class="demo-code-inline">transitionDuration: 600</code>
        </span>
      </span>
      <figcaption class="demo-stage__note">
        Open and close each one — the right viewer animates noticeably slower.
      </figcaption>
    </figure>
    <CodeBlock file="TransitionDuration.vue" :code="snippet" />
  </DemoSection>
</template>
