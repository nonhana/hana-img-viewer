<script setup lang="ts">
import demoImg2 from '../assets/114388636.jpg'
import demoImg1 from '../assets/116811075-1.jpg'
import GithubSVG from './GithubSVG.vue'
</script>

<template>
  <div class="wrapper">
    <a class="icon" href="https://github.com/nonhana/hana-img-viewer" target="_blank">
      <GithubSVG />
    </a>
    <hana-img-viewer class="image" :src="demoImg1" :alt="demoImg1" />
    <hana-img-viewer class="image" :src="demoImg2" :alt="demoImg2" />
  </div>
</template>

<style scoped lang="scss">
.wrapper {
  position: relative;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 32px;
  .icon {
    position: absolute;
    top: 0;
    right: 0;
    margin: 16px;
  }
  @media (min-width: 820px) {
    flex-direction: row;
    justify-content: space-between;
  }
  .image {
    width: 100%;
    @media (min-width: 820px) {
      width: 400px;
    }
  }
}
</style>
