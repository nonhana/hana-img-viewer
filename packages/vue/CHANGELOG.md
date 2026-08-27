# hana-img-viewer

## 5.2.0

### Minor Changes

- [#19](https://github.com/nonhana/hana-img-viewer/pull/19) [`b3b5209`](https://github.com/nonhana/hana-img-viewer/commit/b3b52098267e639e9f54196e86839e441a98a86f) Thanks [@nonhana](https://github.com/nonhana)! - Adjust the public API: remove the custom trigger interface and the `enableZoom` prop, and add `showCloseButton` and `transitionDuration`.
  
  - Remove the custom trigger interface. The viewer always renders its own thumbnail image as the trigger with click, Enter, and Space handling; Vue no longer provides a `thumbnail` slot and React function `children` no longer render a custom trigger.
  - Remove the `enableZoom` prop. Wheel, pinch, double-click, and drag interactions are always enabled; constrain the zoom range with `minZoom` and `maxZoom`.
  - Add `showCloseButton` (default `true`) to render an explicit close button in the top-right corner of the overlay.
  - Add `transitionDuration` (default `300`) to control the open and close FLIP transition duration in milliseconds.

## 5.1.1

### Patch Changes

- [#17](https://github.com/nonhana/hana-img-viewer/pull/17) [`52672e3`](https://github.com/nonhana/hana-img-viewer/commit/52672e3c92f38d66fc0d39902c0bb08f452e968d) Thanks [@nonhana](https://github.com/nonhana)! - Added the `as` attribute to control the wrapper element around the `img`.

## 5.1.0

### Minor Changes

- [#15](https://github.com/nonhana/hana-img-viewer/pull/15) [`64df65d`](https://github.com/nonhana/hana-img-viewer/commit/64df65df30ae736f73231407989ed1063d88face) Thanks [@nonhana](https://github.com/nonhana)! - Refactoring the architectural design of hana-img-viewer

## 5.0.0

### Major Changes

- [#11](https://github.com/nonhana/hana-img-viewer/pull/11) [`17d4922`](https://github.com/nonhana/hana-img-viewer/commit/17d49223c2ecd98125f47a61d255eafc2efaca83) Thanks [@nonhana](https://github.com/nonhana)! - Slim the Vue image previewer down to a lightweight `v-model:open`, HTMLElement portal, and thumbnail slot interface. Drop the selector portal, imperative/exposed API, lifecycle/source events, generic styles, and gesture props, and remove the `@vueuse/core` peer dependency.

## 4.0.0

### Major Changes

- [#9](https://github.com/nonhana/hana-img-viewer/pull/9) [`994886c`](https://github.com/nonhana/hana-img-viewer/commit/994886c1773940eeb2be4d6e3d5f942012abade4) Thanks [@nonhana](https://github.com/nonhana)! - Finalize the refactored v4 public contract for `hana-img-viewer`.

  - keep the component-first package surface and remove the legacy public composable and utility exports from the supported API
  - remove the legacy zoom-model events and deprecated visual-tuning props from the supported API
  - stabilize `src` / `previewSrc` behavior during open sessions, including replacement updates and failed-enhancement retries
  - normalize body-portal semantics for `portalTarget="body"` and `:portal-target="document.body"`, and keep custom portal hosts in charge of their own ESC behavior
  - make the default thumbnail trigger keyboard-accessible and refresh open-session geometry on viewport resize
  - align docs/examples with the final API and migrate the touched source/docs/examples surface to English-only copy and comments

### Patch Changes

- [#9](https://github.com/nonhana/hana-img-viewer/pull/9) [`760bb8c`](https://github.com/nonhana/hana-img-viewer/commit/760bb8c57650a42100e210281924dd2915d40e35) Thanks [@nonhana](https://github.com/nonhana)! - Internal architecture cleanup for v4 (no public API changes).

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

## 3.1.0

### Minor Changes

- [#7](https://github.com/nonhana/hana-img-viewer/pull/7) [`3d11772`](https://github.com/nonhana/hana-img-viewer/commit/3d117729693543237217b33b7c37c3405a790c73) Thanks [@nonhana](https://github.com/nonhana)! - Add a new prop `enableGlobalZoom` to allow zooming with the mouse wheel and zooming with two fingers to be triggered normally outside the preview element.

### Patch Changes

- [#7](https://github.com/nonhana/hana-img-viewer/pull/7) [`42f21a8`](https://github.com/nonhana/hana-img-viewer/commit/42f21a8ceff8fe0125054c8892311b14d47638c2) Thanks [@nonhana](https://github.com/nonhana)! - Use Vue's built-in type tools such as toValue and MaybeRefOrGetter to replace manual coding.

  Simplify useGesture.

- [#7](https://github.com/nonhana/hana-img-viewer/pull/7) [`ba984d1`](https://github.com/nonhana/hana-img-viewer/commit/ba984d1ae40e19b5d124737c666f3c7c7ce40d83) Thanks [@nonhana](https://github.com/nonhana)! - Add path alias for code style.

## 3.0.0

### Major Changes

- [#1](https://github.com/nonhana/hana-img-viewer/pull/1) [`0a9b575`](https://github.com/nonhana/hana-img-viewer/commit/0a9b575e34331d316e1b8bb7b0a8aa2bcdde5268) Thanks [@nonhana](https://github.com/nonhana)! - Refactor the public styling API for thumbnails.

### Patch Changes

- [#3](https://github.com/nonhana/hana-img-viewer/pull/3) [`b2899b8`](https://github.com/nonhana/hana-img-viewer/commit/b2899b8de9409a533e5835aed135fec5509b2805) Thanks [@nonhana](https://github.com/nonhana)! - Update Vite to 8.0
