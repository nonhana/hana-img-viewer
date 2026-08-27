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
      Mount the overlay anywhere by passing <code
        class="
          rounded-sm bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em]
          text-ink-strong
        "
      >container</code>.
      Here it renders inside a scrollable panel in a dialog. While the ref is still
      <code
        class="
          rounded-sm bg-hana-blue-50 px-1.5 py-px font-mono text-[0.85em]
          text-ink-strong
        "
      >null</code> an open request simply waits — the viewer
      resolves it as soon as the container exists.
    </template>
    <figure
      class="
        m-0 flex flex-col items-center justify-center gap-3.5 rounded-lg border
        border-line-soft bg-surface p-6 shadow-lift
      "
    >
      <button
        ref="triggerRef"
        type="button"
        class="
          inline-flex cursor-pointer items-center gap-2 rounded-lg border
          border-line bg-surface px-4 py-2 font-mono text-[13px] text-ink-strong
          select-none
          motion-safe:[transition:background-color_300ms_ease-out,border-color_300ms_ease-out,color_300ms_ease-out,transform_300ms_ease-out]
          motion-safe:hover:border-hana-blue-150
          motion-safe:hover:bg-hana-blue-150 motion-safe:hover:text-hana-blue
          motion-safe:active:scale-[0.95]
        "
        @click="visible = true"
      >
        Preview inside a dialog
      </button>
      <figcaption class="m-0 text-center font-mono text-xs tracking-[0.02em] text-ink">
        The overlay stays inside the dialog's scroll area.
      </figcaption>
    </figure>
    <CodeBlock file="CustomContainer.vue" :code="snippet" />
    <Teleport v-if="visible" to="body">
      <div class="fixed inset-0 z-10000 grid place-items-center p-6">
        <button
          type="button"
          class="absolute inset-0 cursor-pointer border-0 bg-black/40 p-0"
          tabindex="-1"
          aria-label="Close preview dialog"
          @click="visible = false"
        />
        <div
          ref="panelRef"
          class="
            relative flex max-h-[80vh] w-[min(480px,100%)] flex-col gap-3
            rounded-lg border border-line-soft bg-surface p-6 shadow-lift
          "
          role="dialog"
          aria-modal="true"
          aria-label="Preview dialog"
          tabindex="-1"
          @keydown="onPanelKeydown"
        >
          <h3 class="text-[18px]">
            Scroll to the bottom to find the embedded viewer
          </h3>
          <div class="overflow-auto rounded-md border border-line-soft p-3">
            <div class="h-300" />
            <div ref="container" />
            <HanaImgViewer
              class="block w-full max-w-95"
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
