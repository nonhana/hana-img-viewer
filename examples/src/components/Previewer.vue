<script setup lang="ts">
import { HanaImgViewer } from 'hana-img-viewer'
import { ref } from 'vue'
import GithubSVG from './GithubSVG.vue'

const demoImg1 = 'https://pixiv-r2.caelum.moe/121909597.png'
const demoImg2 = 'https://pixiv-r2.caelum.moe/129115891.png'

const demoImg1Open = ref(false)
const demoImg1Zoom = ref(1)
</script>

<template>
  <div class="wrapper">
    <a class="icon" href="https://github.com/nonhana/hana-img-viewer" target="_blank">
      <GithubSVG />
    </a>
    <div class="image">
      <HanaImgViewer
        v-model:open="demoImg1Open"
        v-model:zoom="demoImg1Zoom"
        :src="demoImg1"
        :alt="demoImg1"
      />
      <div class="status">
        <div>是否打开：{{ demoImg1Open }}</div>
        <div>当前缩放：{{ demoImg1Zoom.toFixed(2) }}</div>
      </div>
    </div>
    <div class="image" style="margin-top: 100px;">
      <HanaImgViewer
        :src="demoImg2"
        :alt="demoImg2"
      />
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
  .status {
    margin-top: 8px;
    font-size: 14px;
    color: #666;
  }
}
</style>
