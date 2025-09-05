<script setup lang="ts">
import { HanaImgViewer } from 'hana-img-viewer'
import { ref } from 'vue'
import GithubSVG from './GithubSVG.vue'

const demoImg1 = 'https://pixiv-r2.caelum.moe/121909597.png'
const demoImg2 = 'https://pixiv-r2.caelum.moe/129115891.png'

const demoImg1Displaying = ref(false)
const demoImg1Animating = ref(false)
</script>

<template>
  <div class="wrapper">
    <a class="icon" href="https://github.com/nonhana/hana-img-viewer" target="_blank">
      <GithubSVG />
    </a>
    <div class="image">
      <HanaImgViewer v-model:displaying="demoImg1Displaying" v-model:is-animating="demoImg1Animating" :src="demoImg1" :alt="demoImg1" />
      <div>是否正在显示：{{ demoImg1Displaying }}</div>
      <div>是否正在动画：{{ demoImg1Animating }}</div>
    </div>
    <div class="image">
      <HanaImgViewer :src="demoImg2" :alt="demoImg2" />
    </div>
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
