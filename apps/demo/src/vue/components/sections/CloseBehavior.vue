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
      <code class="demo-code-inline">showCloseButton</code>. The left viewer ignores
      backdrop clicks; the middle one ignores Escape; the right one hides the close
      button.
    </template>
    <figure class="demo-card demo-stage">
      <span class="demo-stage__row">
        <span class="demo-stage__cell">
          <HanaImgViewer
            class="demo-thumb"
            :close-on-backdrop-click="false"
            :src="artImg"
            alt="Closes with Escape or the close button"
          />
          <code class="demo-code-inline">closeOnBackdropClick: false</code>
        </span>
        <span class="demo-stage__cell">
          <HanaImgViewer
            class="demo-thumb"
            :close-on-escape="false"
            :src="gardenImg"
            alt="Closes with a backdrop click or the close button"
          />
          <code class="demo-code-inline">closeOnEscape: false</code>
        </span>
        <span class="demo-stage__cell">
          <HanaImgViewer
            class="demo-thumb"
            :show-close-button="false"
            :src="artImg"
            alt="Closes with the backdrop or Escape only"
          />
          <code class="demo-code-inline">showCloseButton: false</code>
        </span>
      </span>
      <figcaption class="demo-stage__note">
        Try the wrong close gesture first — nothing happens.
      </figcaption>
    </figure>
    <CodeBlock file="CloseBehavior.vue" :code="snippet" />
  </DemoSection>
</template>
