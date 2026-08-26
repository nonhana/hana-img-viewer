# hana-img-viewer

A lightweight image viewer.

## Features

- Thumbnail-origin FLIP open and close
- src-first preview path with optional silent previewSrc enhancement
- Wheel, double-click, drag, and pinch interactions
- SSR-safe thumbnail-only server render

## Usage

Currently support:

- Vue
- React

### Vue

install:

```bash
pnpm add hana-img-viewer
```

import in `.vue` component:

```vue
<script setup lang="ts">
import { HanaImgViewer } from 'hana-img-viewer'
</script>

<template>
  <HanaImgViewer
    src="/images/post-thumb.jpg"
    alt="Article cover"
  />
</template>
```

import `style.css` in `main.ts`:

```ts
import 'hana-img-viewer/style.css'
```

### React

install:

```bash
pnpm add hana-img-viewer-react
```

import in `.tsx` component:

```tsx
import { HanaImgViewer } from 'hana-img-viewer-react'

export default function App() {
  return (
    <HanaImgViewer
      src="/images/post-thumb.jpg"
      alt="Article cover"
    />
  )
}
```

import `style.css` in `main.tsx`:

```ts
import 'hana-img-viewer-react/style.css'
```

controlled usage:

```tsx
import { HanaImgViewer } from 'hana-img-viewer-react'
import { useState } from 'react'

export default function App() {
  const [open, setOpen] = useState(false)

  return (
    <HanaImgViewer
      src="/images/post-thumb.jpg"
      open={open}
      onOpenChange={setOpen}
    />
  )
}
```

## API

### Vue props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `src` | `string` | required | Thumbnail and initial preview source. |
| `as` | `keyof HTMLElementTagNameMap` | `'div'` | HTML element used for the visible thumbnail root. |
| `previewSrc` | `string` | `undefined` | Higher-quality source that silently replaces `src` after loading. |
| `alt` | `string` | `''` | Alternative text for both images. |
| `open` | `boolean` | `false` | Viewer visibility, usually used with `v-model:open`. |
| `container` | `HTMLElement \| null` | `undefined` | Overlay mount container. `undefined` uses `document.body`; `null` waits for a container. |
| `enableZoom` | `boolean` | `true` | Enable transform interactions. |
| `minZoom` | `number` | `0.5` | Minimum zoom. Must be greater than `0` and no greater than `maxZoom`. |
| `maxZoom` | `number` | `10` | Maximum zoom. |
| `closeOnBackdropClick` | `boolean` | `true` | Request close when the backdrop is clicked. |
| `closeOnEscape` | `boolean` | `true` | Request close when the focused viewer receives Escape. |

Vue emits only `update:open`. Use `v-model:open` to keep the state in sync:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const open = ref(false)
</script>

<template>
  <HanaImgViewer
    v-model:open="open"
    src="/images/post-thumb.jpg"
  />
</template>
```

The thumbnail root is a `div` by default. Choose a non-void element compatible with its parent when the viewer is rendered in a constrained HTML context, such as Markdown prose:

```vue
<p>
  <HanaImgViewer as="span" src="/images/post-thumb.jpg" />
</p>
```

### React props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `src` | `string` | required | Thumbnail and initial preview source. |
| `previewSrc` | `string` | `undefined` | Higher-quality source that silently replaces `src` after loading. |
| `alt` | `string` | `''` | Alternative text for both images. |
| `open` | `boolean` | `undefined` | Controlled viewer visibility. |
| `defaultOpen` | `boolean` | `false` | Initial visibility for uncontrolled usage. |
| `onOpenChange` | `(open: boolean) => void` | `undefined` | Called when the viewer requests a visibility change. |
| `container` | `HTMLElement \| null` | `undefined` | Overlay mount container. `undefined` uses `document.body`; `null` waits for a container. |
| `enableZoom` | `boolean` | `true` | Enable wheel, pinch, and double-click zoom. |
| `minZoom` | `number` | `0.5` | Minimum zoom. Must be greater than `0` and no greater than `maxZoom`. |
| `maxZoom` | `number` | `10` | Maximum zoom. |
| `closeOnBackdropClick` | `boolean` | `true` | Request close when the backdrop is clicked. |
| `closeOnEscape` | `boolean` | `true` | Request close when the focused viewer receives Escape. |
| `className` | `string` | `undefined` | Class name for the visible thumbnail root. |
| `style` | `CSSProperties` | `undefined` | Inline style for the visible thumbnail root. |

`open` selects controlled usage when it is defined on the first render. Use `defaultOpen` for uncontrolled initial visibility. Do not switch between the two modes while the component is mounted.
