<script setup lang="ts">
import { HanaImgViewer } from 'hana-img-viewer'
import CodeBlock from '../CodeBlock.vue'
import DemoSection from '../DemoSection.vue'

const artImg = 'https://pixiv-r2.caelum.moe/121909597.png'
const gardenImg = 'https://pixiv-r2.caelum.moe/129115891.png'

const snippet = `<template>
  <!-- Backdrop clicks are ignored; press Escape to close -->
  <HanaImgViewer :close-on-backdrop-click="false" src="/a.png" alt="A" />

  <!-- Escape is ignored; click the backdrop to close -->
  <HanaImgViewer :close-on-escape="false" src="/b.png" alt="B" />
</template>`
</script>

<template>
  <DemoSection
    id="close-behavior"
    index="07"
    title="Close behavior"
    :apis="['closeOnBackdropClick', 'closeOnEscape']"
  >
    <template #description>
      Both escape hatches are opt-out. The left viewer ignores backdrop clicks — press Escape
      instead. The right one ignores Escape — click the backdrop.
    </template>
    <figure class="demo-card demo-stage">
      <span class="demo-stage__row">
        <span class="demo-stage__cell">
          <HanaImgViewer
            class="demo-thumb"
            :close-on-backdrop-click="false"
            :src="artImg"
            alt="Closes with Escape only"
          />
          <code class="demo-code-inline">closeOnBackdropClick: false</code>
        </span>
        <span class="demo-stage__cell">
          <HanaImgViewer
            class="demo-thumb"
            :close-on-escape="false"
            :src="gardenImg"
            alt="Closes with a backdrop click only"
          />
          <code class="demo-code-inline">closeOnEscape: false</code>
        </span>
      </span>
      <figcaption class="demo-stage__note">
        Try the wrong close gesture first — nothing happens.
      </figcaption>
    </figure>
    <CodeBlock file="CloseBehavior.vue" :code="snippet" />
  </DemoSection>
</template>
