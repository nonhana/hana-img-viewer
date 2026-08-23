# hana-img-viewer

一个包含独立 Vue 与 React 包的轻量图片预览器 monorepo。

| 包 | 框架 | 状态 |
| --- | --- | --- |
| `packages/vue` | Vue 3 | `hana-img-viewer` |
| `packages/react` | React 19 | `hana-img-viewer-react`，待首次发布 |
| `packages/core` | — | `hana-img-viewer-core`，待首次发布 |

```bash
pnpm install
pnpm dev:vue
pnpm dev:react
```

## Vue

```bash
pnpm add hana-img-viewer
```

```vue
<script setup lang="ts">
import { HanaImgViewer } from 'hana-img-viewer'
import 'hana-img-viewer/style.css'
</script>

<template>
  <HanaImgViewer src="/images/post-thumb.jpg" preview-src="/images/post-full.jpg" alt="Article cover" />
</template>
```

Vue v5 提供 `src`、`previewSrc`、`alt`、`open`、`container`、`enableZoom`、`minZoom`、`maxZoom`、`closeOnBackdropClick` 与 `closeOnEscape` props，visibility 通过 `v-model:open` 表达。`container` 接受 `HTMLElement | null`，不再接受 selector 或 `'body'` 字符串；attrs 作用于 thumbnail root，完全定制使用 `thumbnail` slot。完整迁移表见 [`packages/vue/README.md`](./packages/vue/README.md)。

## React

```tsx
import { HanaImgViewer } from 'hana-img-viewer-react'
import 'hana-img-viewer-react/style.css'

export function Cover() {
  return <HanaImgViewer src="/images/post-thumb.jpg" alt="Article cover" />
}
```

React 使用独立的 `open/defaultOpen/onOpenChange`、function children 与 `HTMLElement | null` `container` 接口，不提供 imperative ref 或 selector portal。详见 [`docs/react-api.md`](./docs/react-api.md)。

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm changeset status
pnpm test:dist
```
