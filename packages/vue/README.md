# hana-img-viewer

一个轻量的 Vue 3 图片预览器。默认只需要 `src` 和可选的 `alt`，样式从 `style.css` 单独引入。

```bash
pnpm add hana-img-viewer
```

```ts
import 'hana-img-viewer/style.css'
```

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
| `src` | `string` | required | 缩略图与预览第一帧。 |
| `previewSrc` | `string` | `undefined` | 预加载成功后静默替换当前预览。 |
| `alt` | `string` | `''` | 两张图片的替代文本。 |
| `open` | `boolean` | `false` | 使用 `v-model:open` 绑定 desired visibility。 |
| `container` | `HTMLElement \| null` | `undefined` | `undefined` 使用 `document.body`；`null` 保持 pending。 |
| `enableZoom` | `boolean` | `true` | 统一启用或禁用 wheel、pinch、double-click、drag。 |
| `minZoom` | `number` | `0.5` | 最小缩放；调用方必须保证 `0 < minZoom <= maxZoom`。 |
| `maxZoom` | `number` | `10` | 最大缩放。 |
| `closeOnBackdropClick` | `boolean` | `true` | 点击 backdrop 时请求关闭。 |
| `closeOnEscape` | `boolean` | `true` | focused overlay 收到 Escape 时请求关闭。 |

组件只发出 `update:open`，slot 只有 `thumbnail`：

```vue
<HanaImgViewer v-model:open="open" src="/images/post-thumb.jpg" preview-src="/images/post-full.jpg">
  <template #thumbnail="{ open }">
    <button type="button" @click="open">Open preview</button>
  </template>
</HanaImgViewer>
```

普通 `class`、`style` 与其他 attrs 会落到可见的 thumbnail root；需要完全控制图片节点时使用 `thumbnail` slot。

自定义 mount target 只传 HTMLElement：

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

组件本身同时支持局部注册和 `app.use(HanaImgViewer)`；default 与 named export 是同一个组件引用。

## Migrating from v4

| v4 surface | v5 replacement |
| --- | --- |
| selector、`'body'` 字符串 portal | `container` 传 `HTMLElement`、`null` 或省略 prop |
| `enableDrag` | 没有独立开关；`enableZoom` 统一控制 transform gestures |
| zoom bounds | `minZoom` / `maxZoom`；默认 `0.5`–`10` |
| dismissal/keyboard flags | `closeOnBackdropClick` / `closeOnEscape` |
| container/thumbnail class/style props | 普通 attrs；image-level 定制使用 `thumbnail` slot |
| `open`、`close`、`load`、`error` emits | 只监听 `update:open` |
| `open()`、`close()`、`reset()` exposed methods | 通过 `v-model:open` 改变状态 |
| `HanaImgViewerEmits`、`HanaImgViewerExposed` 与 core aliases | 只导入 `HanaImgViewerProps` |
| `@vueuse/core` peer | 不再需要额外安装 |
