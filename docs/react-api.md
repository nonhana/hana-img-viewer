# React API

`hana-img-viewer-react` is the React 19 image viewer. Its first public release
target is 1.0.0; this repository does not claim that release has been
published.

```tsx
import { HanaImgViewer } from 'hana-img-viewer-react'
import 'hana-img-viewer-react/style.css'
```

The package root exports the default component, the named `HanaImgViewer`
component, and the `HanaImgViewerProps` type. The stylesheet is available only
through `hana-img-viewer-react/style.css`.

## Props

| Prop | Type | Default | Contract |
| --- | --- | --- | --- |
| `src` | `string` | required | Thumbnail and first preview frame. A new value immediately restores the current session to the new base source. |
| `previewSrc` | `string` | `undefined` | Optional enhancement loaded only during an overlay session. Success swaps silently; failure keeps the current base and retries next session. |
| `alt` | `string` | `''` | Alternative text for both images. An empty value gives the dialog an internal accessible name. |
| `open` | `boolean` | `undefined` | Controlled desired visibility. Only `open !== undefined` at mount selects controlled mode. |
| `defaultOpen` | `boolean` | `false` | Initial uncontrolled visibility; ignored in controlled mode. |
| `onOpenChange` | `(open: boolean) => void` | `undefined` | Receives user or component visibility intent. Prop synchronization does not echo the callback. |
| `container` | `HTMLElement \| null` | `undefined` | Omission uses `document.body` after hydration. Explicit `null` keeps the request pending without hiding the thumbnail or locking the body. |
| `zoom` | `boolean` | `true` | Enables wheel, pinch, and double-click zoom. |
| `minZoom` | `number` | `0.5` | Minimum scale. Callers must keep `0 < minZoom <= maxZoom`. |
| `maxZoom` | `number` | `10` | Maximum scale. |
| `closeOnBackdropClick` | `boolean` | `true` | Requests close when the backdrop is clicked. |
| `closeOnEscape` | `boolean` | `true` | Requests close when the focused overlay receives Escape. |
| `className` | `string` | `undefined` | Class for the visible thumbnail root. |
| `style` | `CSSProperties` | `undefined` | Style for the visible thumbnail root. |
| `children` | `(controls: { open: () => void }) => ReactNode` | `undefined` | Custom trigger renderer. The consumer owns the custom node's semantics, focus, and styles. |

Controlled and uncontrolled modes must not switch during one mount. Supplying
`onOpenChange` alone does not make the viewer controlled.

## Controlled and uncontrolled usage

```tsx
import { useState } from 'react'

export function ControlledCover() {
  const [open, setOpen] = useState(false)

  return (
    <HanaImgViewer
      src="/cover.jpg"
      open={open}
      onOpenChange={setOpen}
    />
  )
}
```

```tsx
<HanaImgViewer src="/cover.jpg" defaultOpen />
```

In controlled mode, dismissal reports `false` and the overlay stays visible
until the parent updates `open`. Parent prop changes can reverse an in-flight
opening or closing animation.

## Custom trigger

```tsx
<HanaImgViewer src="/cover.jpg">
  {({ open }) => (
    <button type="button" onClick={open}>
      Preview cover
    </button>
  )}
</HanaImgViewer>
```

The default image trigger already supports click, Enter, and Space. A function
child receives only `open()` and must provide its own accessible interaction.

## Custom container

```tsx
import { useState } from 'react'

export function DialogCover() {
  const [container, setContainer] = useState<HTMLElement | null>(null)

  return (
    <section>
      <div ref={setContainer} />
      <HanaImgViewer
        src="/cover.jpg"
        container={container}
        closeOnEscape={false}
      />
    </section>
  )
}
```

Custom containers still receive viewer-owned focus, backdrop, and Escape
behavior unless a dismissal flag delegates that responsibility to the host.
Selector strings are not supported.

## SSR and hydration

Server rendering always emits only the thumbnail, including when `open` or
`defaultOpen` is true. The body or custom container is resolved after
hydration, so the server and first client snapshot match.

The React package intentionally has no imperative `ref`, `open()`, `close()`,
or `reset()` controller and no lifecycle/load callback aliases. Visibility is
owned through `open`, `defaultOpen`, `onOpenChange`, and function children.
