# hana-img-viewer

A lightweight Vue 3 image previewer. Only `src` and an optional `alt` are required to get started; the styles are shipped separately in `style.css`.

## Features

- Thumbnail-origin FLIP open and close
- src-first preview path with optional silent previewSrc enhancement
- Wheel, double-click, drag, and pinch interactions
- SSR-safe thumbnail-only server render

## Usage

Install:

```bash
pnpm add hana-img-viewer
```

Import `style.css` in `main.ts`:

```ts
import 'hana-img-viewer/style.css'
```

Import in a `.vue` component:

```vue
<script setup lang="ts">
import { HanaImgViewer } from 'hana-img-viewer'
</script>

<template>
  <HanaImgViewer src="/images/post-thumb.jpg" alt="Article cover" />
</template>
```

## API

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `src` | `string` | required | Thumbnail and initial preview source. |
| `previewSrc` | `string` | `undefined` | Higher-quality source that silently replaces `src` after loading. |
| `alt` | `string` | `''` | Alternative text for both images. |
| `open` | `boolean` | `false` | Viewer visibility, usually used with `v-model:open`. |
| `container` | `HTMLElement \| null` | `undefined` | Overlay mount container. `undefined` uses `document.body`; `null` waits for a container. |
| `enableZoom` | `boolean` | `true` | Enable wheel, double-click, drag, and pinch interactions. |
| `minZoom` | `number` | `0.5` | Minimum zoom. Must be greater than `0` and no greater than `maxZoom`. |
| `maxZoom` | `number` | `10` | Maximum zoom. |
| `closeOnBackdropClick` | `boolean` | `true` | Request close when the backdrop is clicked. |
| `closeOnEscape` | `boolean` | `true` | Request close when the focused viewer receives Escape. |

The component emits only `update:open`. Use `v-model:open` to keep the state in sync:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const open = ref(false)
</script>

<template>
  <HanaImgViewer v-model:open="open" src="/images/post-thumb.jpg" />
</template>
```

It provides one `thumbnail` slot, which receives an `open` function:

```vue
<HanaImgViewer v-model:open="open" src="/images/post-thumb.jpg" preview-src="/images/post-full.jpg">
  <template #thumbnail="{ open }">
    <button type="button" @click="open">Open preview</button>
  </template>
</HanaImgViewer>
```

Plain `class`, `style`, and other attrs fall through to the visible thumbnail root. Use the `thumbnail` slot when you need full control over the image node.

A custom mount target only accepts an `HTMLElement`:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const container = ref<HTMLElement | null>(null)
</script>

<template>
  <div ref="container" />
  <HanaImgViewer :container="container" src="/images/post-thumb.jpg" />
</template>
```

The component supports both local registration and `app.use(HanaImgViewer)`; the default and named exports are the same component reference.

## Migrating from v4

| v4 surface | v5 replacement |
| --- | --- |
| selector / `'body'` string portal | `container` accepts an `HTMLElement`, `null`, or omission |
| `enableDrag` | no standalone flag; `enableZoom` controls transform gestures |
| zoom bounds | `minZoom` / `maxZoom`; default `0.5`–`10` |
| dismissal/keyboard flags | `closeOnBackdropClick` / `closeOnEscape` |
| container/thumbnail class/style props | plain attrs; use the `thumbnail` slot for image-level customization |
| `open`, `close`, `load`, `error` emits | listen only to `update:open` |
| `open()`, `close()`, `reset()` exposed methods | change state through `v-model:open` |
| `HanaImgViewerEmits`, `HanaImgViewerExposed`, core aliases | import `HanaImgViewerProps` only |
| `@vueuse/core` peer | no longer needs separate installation |
