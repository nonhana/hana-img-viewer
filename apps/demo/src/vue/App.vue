<script setup lang="ts">
import PageHeader from './components/PageHeader.vue'
import BasicUsage from './components/sections/BasicUsage.vue'
import CloseBehavior from './components/sections/CloseBehavior.vue'
import ControlledState from './components/sections/ControlledState.vue'
import CustomContainer from './components/sections/CustomContainer.vue'
import ProgressiveQuality from './components/sections/ProgressiveQuality.vue'
import TransitionDuration from './components/sections/TransitionDuration.vue'
import ZoomControl from './components/sections/ZoomControl.vue'

withDefaults(defineProps<{ ssr?: boolean }>(), { ssr: false })
</script>

<template>
  <PageHeader :ssr="ssr" />
  <p v-if="ssr" class="border-b border-line-soft bg-hana-blue-50 px-6 py-1.5 text-center">
    <span class="font-mono text-[11px] tracking-[0.18em] text-ink uppercase">Prerendered at build time · hydrated on load</span>
  </p>
  <main class="mx-auto flex max-w-5xl flex-col gap-18 px-6 pt-14 pb-20">
    <BasicUsage />
    <ProgressiveQuality />
    <ControlledState />
    <CustomContainer />
    <ZoomControl />
    <CloseBehavior />
    <TransitionDuration />
  </main>
  <footer
    class="
      mx-auto flex max-w-5xl items-baseline gap-5 border-t border-line-soft px-6
      pt-7 pb-14 text-[14px]
    "
  >
    <a
      class="
        cursor-pointer
        bg-[linear-gradient(to_right,var(--color-hana-blue),var(--color-hana-blue))]
        bg-size-[0%_2px] bg-bottom-right bg-no-repeat text-hana-blue
        no-underline
        motion-safe:[transition:background-size_500ms_ease-out]
        motion-safe:hover:bg-size-[100%_2px] motion-safe:hover:bg-bottom-left
      "
      href="https://github.com/nonhana/hana-img-viewer"
      target="_blank"
      rel="noreferrer"
    >GitHub</a>
    <a
      class="
        cursor-pointer
        bg-[linear-gradient(to_right,var(--color-hana-blue),var(--color-hana-blue))]
        bg-size-[0%_2px] bg-bottom-right bg-no-repeat text-hana-blue
        no-underline
        motion-safe:[transition:background-size_500ms_ease-out]
        motion-safe:hover:bg-size-[100%_2px] motion-safe:hover:bg-bottom-left
      " href="/"
    >All demos</a>
    <span class="font-mono text-[11px] tracking-[0.18em] text-ink uppercase">MIT licensed</span>
  </footer>
</template>
