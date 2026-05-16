---
"hana-img-viewer": major
---

Finalize the refactored v4 public contract for `hana-img-viewer`.

- keep the component-first package surface and remove the legacy public composable and utility exports from the supported API
- remove the legacy zoom-model events and deprecated visual-tuning props from the supported API
- stabilize `src` / `previewSrc` behavior during open sessions, including replacement updates and failed-enhancement retries
- normalize body-portal semantics for `portalTarget="body"` and `:portal-target="document.body"`, and keep custom portal hosts in charge of their own ESC behavior
- make the default thumbnail trigger keyboard-accessible and refresh open-session geometry on viewport resize
- align docs/examples with the final API and migrate the touched source/docs/examples surface to English-only copy and comments
