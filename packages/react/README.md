# hana-img-viewer-react

A lightweight React 19 image previewer. Only `src` and an optional `alt` are required to get started; the styles are shipped separately in `style.css`.

## Features

- Thumbnail-origin FLIP open and close
- src-first preview path with optional silent previewSrc enhancement
- Wheel, double-click, drag, and pinch interactions
- SSR-safe thumbnail-only server render

## Usage

Install:

```bash
pnpm add hana-img-viewer-react
```

Import in a `.tsx` component:

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

Import `style.css` in `main.tsx`:

```ts
import 'hana-img-viewer-react/style.css'
```

Controlled usage:

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

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `src` | `string` | required | Thumbnail and initial preview source. |
| `previewSrc` | `string` | `undefined` | Higher-quality source that silently replaces `src` after loading. |
| `alt` | `string` | `''` | Alternative text for both images. |
| `open` | `boolean` | `undefined` | Controlled viewer visibility. |
| `defaultOpen` | `boolean` | `false` | Initial visibility for uncontrolled usage. |
| `onOpenChange` | `(open: boolean) => void` | `undefined` | Called when the viewer requests a visibility change. |
| `container` | `HTMLElement \| null` | `undefined` | Overlay mount container. `undefined` uses `document.body`; `null` waits for a container. |
| `minZoom` | `number` | `0.5` | Minimum zoom. Must be greater than `0` and no greater than `maxZoom`. |
| `maxZoom` | `number` | `10` | Maximum zoom. |
| `closeOnBackdropClick` | `boolean` | `true` | Request close when the backdrop is clicked. |
| `closeOnEscape` | `boolean` | `true` | Request close when the focused viewer receives Escape. |
| `className` | `string` | `undefined` | Class name for the visible thumbnail root. |
| `style` | `CSSProperties` | `undefined` | Inline style for the visible thumbnail root. |

`open` selects controlled usage when it is defined on the first render. Use `defaultOpen` for uncontrolled initial visibility. Do not switch between the two modes while the component is mounted.
