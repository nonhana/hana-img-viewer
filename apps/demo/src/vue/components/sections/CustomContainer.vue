<script setup lang="ts">
import { HanaImgViewer } from 'hana-img-viewer'
import { nextTick, ref, watch } from 'vue'
import CodeBlock from '../CodeBlock.vue'
import DemoSection from '../DemoSection.vue'

const artImg = 'https://pixiv-r2.caelum.moe/121909597.png'

const visible = ref(false)
const container = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const panelRef = ref<HTMLDivElement | null>(null)

watch(visible, async (isVisible, wasVisible) => {
  if (isVisible) {
    await nextTick()
    panelRef.value?.focus()
    return
  }
  if (wasVisible)
    triggerRef.value?.focus()
})

function onPanelKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape')
    visible.value = false
}

// Joined per line: the prerender guard rejects SSR bundles containing bare
// `import ... from 'vue'` lines, which a template literal would emit verbatim.
const snippet = [
  '<script setup lang="ts">',
  'import { HanaImgViewer } from \'hana-img-viewer\'',
  'import { ref } from \'vue\'',
  '',
  'const container = ref<HTMLElement | null>(null)',
  '<\/script>',
  '',
  '<template>',
  '  <section class="scrollable-panel">',
  '    <div ref="container" />',
  '    <HanaImgViewer',
  '      :container="container"',
  '      :close-on-escape="false"',
  '      src="/photos/artwork.png"',
  '      alt="Artwork"',
  '    />',
  '  </section>',
  '</template>',
].join('\n')
</script>

<template>
  <DemoSection id="custom-container" index="05" title="Custom container" :apis="['container']">
    <template #description>
      Mount the overlay anywhere by passing <code class="demo-code-inline">container</code>.
      Here it renders inside a scrollable panel in a dialog. While the ref is still
      <code class="demo-code-inline">null</code> an open request simply waits — the viewer
      resolves it as soon as the container exists.
    </template>
    <figure class="demo-card demo-stage">
      <button
        ref="triggerRef"
        type="button"
        class="demo-button"
        @click="visible = true"
      >
        Preview inside a dialog
      </button>
      <figcaption class="demo-stage__note">
        The overlay stays inside the dialog's scroll area.
      </figcaption>
    </figure>
    <CodeBlock file="CustomContainer.vue" :code="snippet" />
    <!-- v-if sits on the Teleport itself so SSR emits no teleport anchors;
         hydrating anchors whose content was never prerendered into <body>
         corrupts the #app mount node. -->
    <Teleport v-if="visible" to="body">
      <div class="demo-dialog-mask">
        <button
          type="button"
          class="demo-dialog-backdrop"
          tabindex="-1"
          aria-label="Close preview dialog"
          @click="visible = false"
        />
        <div
          ref="panelRef"
          class="demo-card demo-dialog-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Preview dialog"
          tabindex="-1"
          @keydown="onPanelKeydown"
        >
          <h3>Scroll to the bottom to find the embedded viewer</h3>
          <div class="demo-dialog-scroll">
            <div class="demo-dialog-spacer" />
            <div ref="container" />
            <HanaImgViewer
              class="demo-thumb"
              :container="container"
              :close-on-escape="false"
              :src="artImg"
              alt="Artwork 121909597"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </DemoSection>
</template>
