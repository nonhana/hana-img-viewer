# hana-img-viewer

A lightweight image previewer with independent Vue and React packages in one
monorepo.

| 包 | 框架 | 发布状态 |
| --- | --- | --- |
| `packages/vue` | Vue 3 | [`hana-img-viewer`](https://www.npmjs.com/package/hana-img-viewer) v4.x |
| `packages/react` | React 19 | `hana-img-viewer-react`，源码 0.0.0；Release PR 目标 1.0.0 |
| `packages/core` | — | `hana-img-viewer-core`，源码 0.0.0；Release PR 目标 1.0.0 |

两端共享框架无关的行为结果（[docs/behavior-spec.md](./docs/behavior-spec.md)），
但各自采用符合框架习惯的独立接口和实现。React API 见
[docs/react-api.md](./docs/react-api.md)。Vue、React 与 core 使用独立语义版本。

## Installation

```bash
# Vue
pnpm add hana-img-viewer
# React（首次发布完成后）
pnpm add hana-img-viewer-react react react-dom
```

## Demo

```bash
pnpm install
pnpm dev:vue    # apps/vue-demo
pnpm dev:react  # apps/react-demo
```

验证：`pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:dist`。

## Vue

A lightweight Vue 3 image viewer that is simple to drop in.

## Features

- Thumbnail-origin FLIP open and close
- `src`-first preview path with optional silent `previewSrc` enhancement
- Wheel, double-click, drag, and pinch interactions
- SSR-safe thumbnail-only server render
- Extracted CSS output with a standard bundler-friendly entry

## Installation

```bash
pnpm add hana-img-viewer
```

## Basic usage

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

Import `style.css` in `main.ts`:

```ts
import 'hana-img-viewer/style.css'
```

## `src` and `previewSrc`

`src` is required and always drives:

- the thumbnail
- the first visible preview frame
- the FLIP transition source

If `previewSrc` is provided, the viewer opens from `src` immediately and upgrades the visible bitmap in place after `previewSrc` is ready. There is no explicit loading UI and no second transition.

```vue
<HanaImgViewer
  src="/images/post-thumb.jpg"
  preview-src="/images/post-full.jpg"
  alt="Article cover"
/>
```

## API

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `src` | `string` | - | Required thumbnail and first-preview source. |
| `alt` | `string` | `''` | Accessible alt text. |
| `previewSrc` | `string` | - | Optional silent enhancement source. |
| `open` | `boolean` | - | Controlled open state. |
| `portalTarget` | `string \| HTMLElement \| null` | `'body'` | Overlay mount target. `null` keeps the open request pending until a custom target exists. |
| `enableZoom` | `boolean` | `true` | Enable wheel, double-click, and pinch zoom. |
| `enableDrag` | `boolean` | `true` | Enable drag while open. |
| `minZoom` | `number` | `0.5` | Minimum zoom ratio. |
| `maxZoom` | `number` | `10` | Maximum zoom ratio. |
| `closeOnMaskClick` | `boolean` | `true` | Close when clicking the backdrop. |
| `enableKeyboard` | `boolean` | `true` | Allow ESC close when the viewer owns the active body portal. |
| `containerClass` | `HTMLAttributes['class']` | - | Thumbnail container class hook. |
| `containerStyle` | `StyleValue` | - | Thumbnail container style hook. |
| `thumbnailClass` | `HTMLAttributes['class']` | - | Thumbnail image class hook. |
| `thumbnailStyle` | `StyleValue` | - | Thumbnail image style hook. |

### Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:open` | `boolean` | Controlled open-state intent. |
| `open` | - | Fired when the viewer becomes visibly open on the client. |
| `close` | - | Fired when the viewer finishes closing. |
| `load` | `Event` | Fired when the enhancement source becomes active. |
| `error` | `Event` | Fired when the enhancement source fails. |

### Slots

| Slot | Props | Description |
| --- | --- | --- |
| `thumbnail` | `{ open: () => void }` | Custom thumbnail trigger. |

### Exposed methods

```ts
interface HanaImgViewerExposed {
  open: () => void | Promise<void>
  close: () => void | Promise<void>
  reset: () => void
}
```

Example:

```vue
<script setup lang="ts">
import type { HanaImgViewerExposed } from 'hana-img-viewer'
import { ref } from 'vue'

const viewerRef = ref<HanaImgViewerExposed | null>(null)
</script>

<template>
  <button @click="viewerRef?.open()">
    Open
  </button>
  <HanaImgViewer ref="viewerRef" src="/images/post-thumb.jpg" />
</template>
```

## Controlled mode

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(false)
</script>

<template>
  <button @click="isOpen = true">
    Open preview
  </button>

  <HanaImgViewer
    v-model:open="isOpen"
    src="/images/post-thumb.jpg"
    alt="Controlled preview"
  />
</template>
```

## Custom thumbnail

```vue
<HanaImgViewer src="/images/post-full.jpg" alt="Custom trigger preview">
  <template #thumbnail="{ open }">
    <button class="thumb-button" type="button" @click="open">
      Open preview
    </button>
  </template>
</HanaImgViewer>
```

## Custom portal target

Use `portalTarget` when the preview should stay inside a host layer, such as a dialog.

```vue
<script setup lang="ts">
import { ref } from 'vue'

const portalTarget = ref<HTMLElement | null>(null)
</script>

<template>
  <div ref="portalTarget" />

  <HanaImgViewer
    :portal-target="portalTarget"
    src="/images/post-thumb.jpg"
    alt="Dialog scoped preview"
  />
</template>
```

`portalTarget="body"` and `:portal-target="document.body"` both use the default body portal behavior.

When `portalTarget` is a custom element, the host remains the final ESC authority by default.

## React

The React 19 package is a separate, React-idiomatic interface. Its first public
release target is 1.0.0; the source package is not published yet.

```tsx
import { HanaImgViewer } from 'hana-img-viewer-react'
import 'hana-img-viewer-react/style.css'

export function Cover() {
  return (
    <HanaImgViewer
      src="/images/post-thumb.jpg"
      previewSrc="/images/post-full.jpg"
      alt="Article cover"
    />
  )
}
```

React supports controlled `open`, uncontrolled `defaultOpen`, function
children for custom triggers, and an `HTMLElement | null` `container`. It does
not expose an imperative ref or selector-based portal API. See the complete
[React API reference](./docs/react-api.md).
