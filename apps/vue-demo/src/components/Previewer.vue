<script setup lang="ts">
import { HanaImgViewer } from 'hana-img-viewer'
import { ref } from 'vue'
import GithubSVG from './GithubSVG.vue'

const demoImg1 = 'https://grey-flowers-r2.caelum.moe/article-covers/202608/23b4cde2-be1a-47f2-b15a-5abe5dacc3af.jpg'
const demoImg1Preview = 'https://pixiv-r2.caelum.moe/121909597.png'
const demoImg2 = 'https://pixiv-r2.caelum.moe/129115891.png'

const demoImg1Open = ref(false)
</script>

<template>
  <div class="wrapper">
    <a class="icon" href="https://github.com/nonhana/hana-img-viewer" target="_blank">
      <GithubSVG />
    </a>
    <div class="image">
      <HanaImgViewer
        v-model:open="demoImg1Open"
        :src="demoImg1"
        :preview-src="demoImg1Preview"
        :alt="demoImg1"
      />
      <div class="status">
        <div>Open state: {{ demoImg1Open }}</div>
        <div>`previewSrc` replaces the visible image silently after opening</div>
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
