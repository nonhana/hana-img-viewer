---
'hana-img-viewer': major
---

Slim the Vue image previewer down to a lightweight `v-model:open`, HTMLElement portal, and thumbnail slot interface. Drop the selector portal, imperative/exposed API, lifecycle/source events, generic styles, and gesture props, and remove the `@vueuse/core` peer dependency.
