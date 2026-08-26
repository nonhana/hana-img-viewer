<script setup lang="ts">
import GithubSVG from './GithubSVG.vue'

defineProps<{ ssr: boolean }>()
</script>

<!--
  Rendered before the hero thumbnail, so it must not emit any </div>:
  the dist verifier captures #app content up to the first closing div
  and requires an <img> inside it. Stick to header/nav/a/span/strong.
-->
<template>
  <header class="page-header">
    <nav class="page-header__nav" aria-label="Demo navigation">
      <a class="page-header__brand" href="/">
        <strong class="page-header__name">hana-img-viewer</strong>
        <span class="demo-badge demo-badge--accent">Vue</span>
        <span v-if="ssr" class="demo-badge">SSR</span>
      </a>
      <span class="page-header__links">
        <a class="demo-link" :href="ssr ? '/react-ssr.html' : '/react.html'">React</a>
        <a class="demo-link" :href="ssr ? '/vue.html' : '/vue-ssr.html'">{{ ssr ? 'SPA' : 'SSR' }}</a>
        <a
          class="page-header__github"
          href="https://github.com/nonhana/hana-img-viewer"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub repository"
        >
          <GithubSVG />
        </a>
      </span>
    </nav>
  </header>
</template>
