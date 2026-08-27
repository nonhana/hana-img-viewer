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
  <header class="sticky top-0 z-100 border-b border-line-soft bg-[oklch(0.98_0_0/_0.85)] [-webkit-backdrop-filter:blur(8px)]">
    <nav class="mx-auto flex w-full max-w-[1024px] items-center justify-between gap-4 px-6 py-3.5" aria-label="Demo navigation">
      <a class="inline-flex items-center gap-2.5 text-ink-strong no-underline" href="/">
        <strong class="font-serif text-[17px] font-bold">hana-img-viewer</strong>
        <span class="inline-block whitespace-nowrap rounded-full border border-hana-blue bg-hana-blue-50 px-3 py-[2px] font-mono text-[11px] uppercase tracking-[0.18em] text-hana-blue">Vue</span>
        <span v-if="ssr" class="inline-block whitespace-nowrap rounded-full border border-line bg-surface px-3 py-[2px] font-mono text-[11px] uppercase tracking-[0.18em] text-ink">SSR</span>
      </a>
      <span class="inline-flex items-center gap-[18px] font-mono text-[13px]">
        <a class="cursor-pointer no-underline text-hana-blue bg-[linear-gradient(to_right,var(--color-hana-blue),var(--color-hana-blue))] bg-no-repeat bg-bottom-right bg-size-[0%_2px] motion-safe:[transition:background-size_500ms_ease-out] motion-safe:hover:bg-bottom-left motion-safe:hover:bg-size-[100%_2px]" :href="ssr ? '/react-ssr.html' : '/react.html'">React</a>
        <a class="cursor-pointer no-underline text-hana-blue bg-[linear-gradient(to_right,var(--color-hana-blue),var(--color-hana-blue))] bg-no-repeat bg-bottom-right bg-size-[0%_2px] motion-safe:[transition:background-size_500ms_ease-out] motion-safe:hover:bg-bottom-left motion-safe:hover:bg-size-[100%_2px]" :href="ssr ? '/vue.html' : '/vue-ssr.html'">{{ ssr ? 'SPA' : 'SSR' }}</a>
        <a
          class="inline-flex text-ink-strong motion-safe:[transition:color_300ms_ease-out] motion-safe:hover:text-hana-blue"
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
