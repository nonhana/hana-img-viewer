<script setup lang="ts">
import PageHeader from './components/PageHeader.vue'
import BasicUsage from './components/sections/BasicUsage.vue'
import CloseBehavior from './components/sections/CloseBehavior.vue'
import ControlledState from './components/sections/ControlledState.vue'
import CustomContainer from './components/sections/CustomContainer.vue'
import ProgressiveQuality from './components/sections/ProgressiveQuality.vue'
import TransitionDuration from './components/sections/TransitionDuration.vue'
import ZoomControl from './components/sections/ZoomControl.vue'

// The SSR entries pass true so the prerendered and hydrated DOM stay identical.
withDefaults(defineProps<{ ssr?: boolean }>(), { ssr: false })
</script>

<template>
  <PageHeader :ssr="ssr" />
  <p v-if="ssr" class="border-b border-line-soft bg-hana-blue-50 px-6 py-1.5 text-center">
    <span class="font-mono text-[11px] uppercase tracking-[0.18em] text-ink">Prerendered at build time · hydrated on load</span>
  </p>
  <main class="mx-auto flex max-w-[1024px] flex-col gap-18 px-6 pb-20 pt-14">
    <BasicUsage />
    <ProgressiveQuality />
    <ControlledState />
    <CustomContainer />
    <ZoomControl />
    <CloseBehavior />
    <TransitionDuration />
  </main>
  <footer class="mx-auto flex max-w-[1024px] items-baseline gap-5 border-t border-line-soft px-6 pb-14 pt-7 text-[14px]">
    <a
      class="cursor-pointer no-underline text-hana-blue bg-[linear-gradient(to_right,var(--color-hana-blue),var(--color-hana-blue))] bg-no-repeat bg-bottom-right bg-size-[0%_2px] motion-safe:[transition:background-size_500ms_ease-out] motion-safe:hover:bg-bottom-left motion-safe:hover:bg-size-[100%_2px]"
      href="https://github.com/nonhana/hana-img-viewer"
      target="_blank"
      rel="noreferrer"
    >GitHub</a>
    <a class="cursor-pointer no-underline text-hana-blue bg-[linear-gradient(to_right,var(--color-hana-blue),var(--color-hana-blue))] bg-no-repeat bg-bottom-right bg-size-[0%_2px] motion-safe:[transition:background-size_500ms_ease-out] motion-safe:hover:bg-bottom-left motion-safe:hover:bg-size-[100%_2px]" href="/">All demos</a>
    <span class="font-mono text-[11px] uppercase tracking-[0.18em] text-ink">MIT licensed</span>
  </footer>
</template>
