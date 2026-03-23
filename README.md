# hana-img-viewer

A lightweight and elegant image previewer for Vue 3 with smooth FLIP animations and touch gesture support.

## Features

- **FLIP Animation**: Smooth transition from thumbnail to preview using the FLIP animation technique
- **Touch Gestures**: Drag, pan, and pinch-to-zoom with natural physics
- **TypeScript**: Full type safety with complete type definitions
- **SSR Friendly**: Works seamlessly with server-side rendering
- **Lightweight**: Only ~5KB gzipped
- **Vue 3 Composition API**: Built with modern Vue 3 patterns

## Installation

```bash
pnpm add hana-img-viewer
```

## Basic Usage

### Partial Import

Import the component where you need it:

```vue
<script setup lang="ts">
import { HanaImgViewer } from 'hana-img-viewer'
</script>

<template>
  <HanaImgViewer src="/path/to/image.jpg" alt="Image description" />
</template>
```

### Global Registration

Register globally in your `main.ts`:

```ts
import HanaImgViewer from 'hana-img-viewer'
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.use(HanaImgViewer)
app.mount('#app')
```

Then use in any component:

```vue
<template>
  <hana-img-viewer src="/path/to/image.jpg" alt="Image description" />
</template>
```

## API Reference

### Props

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `src` | `string` | - | **Required**. Image URL. |
| `alt` | `string` | `''` | Alternative text for the image. |
| `previewSrc` | `string` | - | High-resolution image URL for preview (defaults to `src`). |
| `containerClass` | `HTMLAttributes['class']` | - | Extra class for the thumbnail container. |
| `containerStyle` | `StyleValue` | - | Extra style for the thumbnail container. |
| `thumbnailClass` | `HTMLAttributes['class']` | - | Extra class for the thumbnail image. |
| `thumbnailStyle` | `StyleValue` | - | Extra style for the thumbnail image. |
| `duration` | `number` | `300` | Animation duration in milliseconds. |
| `easing` | `string` | `'cubic-bezier(0.4, 0, 0.2, 1)'` | Animation easing function. |
| `maskColor` | `string` | `'#000'` | Mask background color. |
| `maskOpacity` | `number` | `0.3` | Mask opacity (0-1). |
| `zIndex` | `number` | `9999` | Preview layer z-index. |
| `minZoom` | `number` | `0.5` | Minimum zoom level. |
| `maxZoom` | `number` | `10` | Maximum zoom level. |
| `zoomStep` | `number` | `0.5` | Zoom increment per step. |
| `doubleClickZoom` | `number` | `2` | Target zoom level on double-click. |
| `wheelZoomRatio` | `number` | `1` | Wheel zoom sensitivity multiplier. |
| `enableZoom` | `boolean` | `true` | Enable zoom functionality. |
| `enableDrag` | `boolean` | `true` | Enable drag to pan. |
| `enablePinch` | `boolean` | `true` | Enable pinch-to-zoom on touch devices. |
| `enableGlobalZoom` | `boolean` | `true` | Enable zooming outside of img element. |
| `enableDoubleClick` | `boolean` | `true` | Enable double-click to zoom. |
| `enableKeyboard` | `boolean` | `true` | Enable keyboard controls (ESC to close). |
| `closeOnMaskClick` | `boolean` | `true` | Close preview when clicking the mask. |

### v-model Bindings

| Binding | Type | Description |
| ------- | ---- | ----------- |
| `v-model:open` | `boolean` | Controls preview open/close state. |
| `v-model:zoom` | `number` | Controls current zoom level. |

### Events

| Event | Payload | Description |
| ----- | ------- | ----------- |
| `open` | - | Emitted when preview opens. |
| `close` | - | Emitted when preview closes. |
| `zoomChange` | `number` | Emitted when zoom level changes. |
| `load` | `Event` | Emitted when image loads successfully. |
| `error` | `Event` | Emitted when image fails to load. |

### Slots

| Slot | Props | Description |
| ---- | ----- | ----------- |
| `thumbnail` | `{ open: () => void }` | Custom thumbnail content. |
| `loading` | - | Custom loading state. |
| `error` | - | Custom error state. |
| `toolbar` | `{ zoom, zoomIn, zoomOut, reset, close, canZoomIn, canZoomOut }` | Custom toolbar. |

### Exposed Methods & State

Access via template ref.

**Exposed State:**

- `isOpen` - Preview open state
- `isAnimating` - Animation state
- `zoom` - Current zoom level
- `transform` - Current transform state
- `loadState` - Image load state (`'idle' | 'loading' | 'loaded' | 'error'`)
- `canZoomIn` - Whether can zoom in
- `canZoomOut` - Whether can zoom out
- `isDragging` - Drag state
- `isPinching` - Pinch state

**Exposed Methods:**

- `open()` - Open preview
- `close()` - Close preview
- `zoomIn()` - Zoom in
- `zoomOut()` - Zoom out
- `setZoom(level)` - Set zoom level
- `resetZoom()` - Reset zoom to initial
- `resetTransform()` - Reset all transforms

## License

MIT
