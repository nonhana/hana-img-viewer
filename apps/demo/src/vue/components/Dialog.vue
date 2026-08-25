<script setup lang="ts">
import { HanaImgViewer } from 'hana-img-viewer'
import { ref } from 'vue'

const visible = ref(false)
const container = ref<HTMLElement | null>(null)

function open() {
  visible.value = true
}
</script>

<template>
  <el-button @click="open">
    Preview inside a dialog
  </el-button>
  <el-dialog v-model="visible" title="Scroll to the bottom to inspect the embedded viewer" width="30%">
    <div style="height: 2000px; width: 100%;" />
    <div ref="container" />
    <HanaImgViewer
      :container="container"
      src="https://pixiv-r2.caelum.moe/121909597.png"
      alt="121909597.png"
    />
  </el-dialog>
</template>
