<script setup lang="ts">
import { HanaImgViewer } from 'hana-img-viewer'
import { ref } from 'vue'

const visible = ref(false)

function open() {
  visible.value = true
}
</script>

<template>
  <el-button @click="open">
    弹窗内图片预览
  </el-button>
  <el-dialog v-model="visible" title="请滚动到底部查看内嵌效果" width="30%">
    <div style="height: 2000px; width: 100%;" />
    <HanaImgViewer src="https://pixiv-r2.caelum.moe/121909597.png" alt="121909597.png" />
  </el-dialog>
</template>
