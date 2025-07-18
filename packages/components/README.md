# hana-img-viewer

A lightweight and easy-to-use image previewer for Vue 3.

## Features

- Support touch gestures, drag and pan physical effect sliding, two-finger specified position to zoom in and out
- Based on `typescript`, type safe
- Just like use the `<img>` tag, you can use the `src` attribute to specify the image source
- SSR friendly
- Lightweight, only 10KB

## Installation

```bash
pnpm add hana-img-viewer
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
    <HanaImgViewer :src="demoImg" :alt="demoImg" />
  </div>
</template>
```

### 2. global registration

In your Vue3 + TypeScript project, you can register the component globally in the `main.ts` file.

```ts [main.ts]
import HanaImgViewer from 'hana-img-viewer'
import { createApp } from 'vue'
import App from './App.vue'

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

Following are the props that you can pass to the `hana-img-viewer` component.

| **Prop**           | **Type**           | **Default** | **Description**                             |
| ------------------ | ------------------ | ----------- | ------------------------------------------- |
| `src`              | `string`           | -           | Required. Image URL.                        |
| `alt`              | `string`           | `''`        | Alternative text describing the image.      |
| `width`            | `string \| number` | `auto`      | Image width.                                |
| `height`           | `string \| number` | `auto`      | Image height.                               |
| `duration`         | `number`           | `500`       | Transition animation duration (ms).         |
| `maskBgColor`      | `string`           | `'black'`   | Mask background color.                      |
| `maskOpacity`      | `number`           | `0.1`       | Mask opacity (0-1).                         |
| `previewZIndex`    | `number`           | `1000`      | `z-index` of the preview layer.             |
| `previewMaxWidth`  | `string \| number` | `'80vw'`    | Max width of the preview area.              |
| `previewMaxHeight` | `string \| number` | `'80vh'`    | Max height of the preview area.             |
| `zoomStep`         | `number`           | `0.2`       | Zoom step, the increment ratio for scaling. |
| `zoomMin`          | `number`           | `0.2`       | Minimum zoom ratio.                         |
| `zoomMax`          | `number`           | `10`        | Maximum zoom ratio.                         |
| `dblClickZoom`     | `boolean`          | `true`      | Enable double-click zoom.                   |
| `dblClickZoomTo`   | `number`           | `2`         | Target zoom ratio for double-click.         |

## License

MIT
