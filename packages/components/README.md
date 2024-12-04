# hana-img-viewer

**A lightweight and easy-to-use image previewer for Vue 3.**

## Features

- Support touch gestures, drag and pan physical effect sliding, two-finger specified position to zoom in and out
- Based on `typescript`, type safe
- Just like use the `<img>` tag, you can use the `src` attribute to specify the image source

## Installation

```bash
pnpm add hana-img-viewer -D
```

## Basic Usage

### 1. partial import

You can just import the component where you need it.

```vue
<script setup lang="ts">
import { HanaImgViewer } from 'hana-img-viewer'
import demoImg from '../assets/114388636.jpg'
</script>

<template>
  <div class="wrapper">
    <hana-img-viewer :src="demoImg" :alt="demoImg" />
  </div>
</template>
```

### 2. global registration

In your Vue3 + TypeScript project, you can register the component globally in the `main.ts` file.

```ts [main.ts]
import { createApp } from 'vue'
import App from './App.vue'
import HanaImgViewer from 'hana-img-viewer'

const app = createApp(App)

app.use(HanaImgViewer)

app.mount('#app')
```

Then you can use the component in any `.vue` file.

```vue
<script setup lang="ts">
// import { HanaImgViewer } from 'hana-img-viewer' // no need to import
import demoImg from '../assets/114388636.jpg'
</script>

<template>
  <div class="wrapper">
    <hana-img-viewer :src="demoImg" :alt="demoImg" />
  </div>
</template>
```

## Props

以下是提供的所有属性：

| **Prop**           | **Type**           | **Default** | **Description**                              |
| ------------------ | ------------------ | ----------- | -------------------------------------------- |
| `src`              | `string`           | -           | 必填，图片的 URL。                           |
| `alt`              | `string`           | `''`        | 图片的替代文本，用于描述图片内容。           |
| `width`            | `string \| number` | `auto`      | 图片的宽度。                                 |
| `height`           | `string \| number` | `auto`      | 图片的高度。                                 |
| `duration`         | `number`           | `500`       | 过渡动画的持续时间（单位：毫秒）。           |
| `maskBgColor`      | `string`           | `'black'`   | 遮罩层的背景颜色。                           |
| `maskOpacity`      | `number`           | `0.1`       | 遮罩层的透明度，范围为 0 ~ 1。               |
| `previewZIndex`    | `number`           | `1000`      | 预览层的 `z-index` 值，用于控制层级关系。    |
| `previewMaxWidth`  | `string \| number` | `'80vw'`    | 图片预览区域的最大宽度。                     |
| `previewMaxHeight` | `string \| number` | `'80vh'`    | 图片预览区域的最大高度。                     |
| `zoomStep`         | `number`           | `0.2`       | 缩放时的步进值，每次放大或缩小时的比例增量。 |
| `zoomMin`          | `number`           | `0.2`       | 最小缩放比例。                               |
| `zoomMax`          | `number`           | `10`        | 最大缩放比例。                               |
| `dblClickZoom`     | `boolean`          | `true`      | 是否启用双击放大功能。                       |
| `dblClickZoomTo`   | `number`           | `2`         | 双击放大时的目标比例。                       |

---

## License

MIT
