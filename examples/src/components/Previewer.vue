<script setup lang="ts">
import { HanaImgViewer } from 'hana-img-viewer'
import demoImg from '../assets/110645642.png'
</script>

<template>
  <div class="wrapper">
    <HanaImgViewer :src="demoImg" :alt="demoImg" />
  </div>
</template>

<style scoped>
.wrapper {
  position: relative;
  max-width: 400px;
}
</style>
