---
"hana-img-viewer": patch
---

Internal architecture cleanup for v4 (no public API changes).

- introduce `useViewerPhase` as the single source of truth for the open/opening/open/closing state machine, replacing the removed `useViewerOpenState`; `isOpen` is now a derived read-only computed
- collapse the four-input god watcher into a single `desiredPhase` effect, so every phase → animation transition flows through one path; `openPreview` / `closePreview` become pure intent declarations
- promote `isControlled` from a `computed` to a setup-time `const boolean` decided once from `vnode.props`, eliminating the runtime-tracking edge case
- adopt `@vueuse/core` for `useEventListener`, `useDebounceFn`, `isClient`, and `tryOnScopeDispose`; remove the handwritten `composables/utils/` directory; add `@vueuse/core ^14.0.0` as a peer dependency
- add `role="dialog"`, `aria-modal="true"`, and `aria-label` on the overlay for screen-reader accessibility
- debounce resize-driven geometry recompute (50 ms) to avoid flurries during viewport changes
- fix a stale-`sessionToken` bug in `runEnhancement` so high-res preview swaps survive `src`/`previewSrc` changes during an open session
- drop the module-level image cache in `useViewerSource`, deferring dedup to the browser HTTP cache (removes a memory-leak vector)
- expose `addScale` / `multiplyScale` on `useViewerTransform`; rename its return key `style` → `transformCss` for clarity
- separate `dblclick` handling from `useDrag.filter` into its own listener; make `useViewerInteractions.zoomTarget` reactive so runtime ref swaps rebind correctly
- convert the `TrackpadDetector` class in `useWheel` to a factory closure
- remove the internal `PropsType` / `EmitsType` compat aliases (canonical `HanaImgViewerProps` / `HanaImgViewerEmits` already exported)
- add unit coverage for `useViewerPhase`, `useViewerTransform`, `useViewerSource`; add component coverage for `useBodyLock`, `resolvePortalTarget`, and a PRD-level box-stability proof for `previewSrc` upgrades — total tests grew from 26 to 52

Consumers must now also install `@vueuse/core ^14.0.0` alongside `hana-img-viewer` and `vue ^3.5.0`.
