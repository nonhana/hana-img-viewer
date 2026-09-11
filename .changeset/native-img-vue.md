---
'hana-img-viewer': major
---

Render the thumbnail as a native `img` element. `class`, `style`, and every unknown attribute now fall through to the rendered `img` instead of a wrapper element, and built-in sizing styles were removed so the thumbnail behaves like a plain image. The `as` prop was removed; the component renders an `img` and needs no wrapper element in constrained HTML contexts.