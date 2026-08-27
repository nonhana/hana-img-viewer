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
  <p v-if="ssr" class="ssr-note">
    <span class="demo-meta">Prerendered at build time · hydrated on load</span>
  </p>
  <main class="demo-page">
    <BasicUsage />
    <ProgressiveQuality />
    <ControlledState />
    <CustomContainer />
    <ZoomControl />
    <CloseBehavior />
    <TransitionDuration />
  </main>
  <footer class="demo-footer">
    <a
      class="demo-link"
      href="https://github.com/nonhana/hana-img-viewer"
      target="_blank"
      rel="noreferrer"
    >GitHub</a>
    <a class="demo-link" href="/">All demos</a>
    <span class="demo-meta">MIT licensed</span>
  </footer>
</template>
