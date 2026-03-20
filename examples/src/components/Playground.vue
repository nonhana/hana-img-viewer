<script lang="ts" setup>
import { HanaImgViewer } from 'hana-img-viewer'
</script>

<template>
  <HanaImgViewer
    src="https://pixiv-r2.caelum.moe/121909597.png"
    alt="121909597.png"
    container-class="demo-img"
    thumbnail-class="demo-img-thumbnail"
  />
</template>

<style lang="scss">
.demo-img {
  height: 100px;
  border: 2px solid;
}
</style>
