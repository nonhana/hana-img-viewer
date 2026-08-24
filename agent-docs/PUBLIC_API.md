# Public API

The root [`README.md`](../README.md) is the single source of truth for consumer-facing Vue and React API descriptions and examples. Keep it aligned with the package manifests, `src/public-types.ts`, runtime exports, and distribution-contract tests; do not create a second framework API document.

## UI Package Surfaces

Both UI packages are ESM-only. Their package roots resolve to `dist/index.js` with `dist/index.d.ts`, and their stylesheets are separate `./style.css` exports. Consumers must import the stylesheet explicitly.

`hana-img-viewer` exposes:

- default and named `HanaImgViewer` as the same installable Vue component identity;
- the `HanaImgViewerProps` type;
- only the `update:open` event and `thumbnail` slot described in the root README.

Its `sideEffects` contract is `['**/*.css', 'src/index.ts']`, its peer is Vue `^3.5.0`, and its package files are limited to `dist`.

`hana-img-viewer-react` exposes:

- default and named `HanaImgViewer` as the same component identity;
- the `HanaImgViewerProps` type;
- no imperative controller, selector portal, compatibility aliases, lifecycle callbacks, source callbacks, or core/internal type re-exports.

Its `sideEffects` contract is `['**/*.css']`, its peers are React and React DOM `^19.0.0`, and its package files are limited to `dist`.

The two frameworks may evolve different props and ownership models. In both current UI APIs, `container` accepts only `HTMLElement | null` when provided; the selector-aware core portal types are not UI package exports.

## Core Package Surface

`hana-img-viewer-core` exports `src/index.ts` directly and publishes only `src`. The root re-exports:

- values and functions: `DEFAULT_TRANSFORM`, `clamp`, `createPinchState`, `createTrackpadDetector`, `getDistance`, `getMidpoint`, `getScrollbarWidth`, `getTouchMetrics`, `getTwoTouches`, `getZoomAnchoredPosition`, `isBodyPortalTarget`, `isHTMLElement`, `loadImage`, `resolveAspectRatio`, and `resolvePortalTarget`;
- types: `PinchState`, `Point`, `PortalTarget`, `TrackpadDetector`, `Transform`, `ViewerInteractionPhase`, `ViewerSourcePhase`, `ViewerTransformAnchor`, and `WheelState`.

Changing any named export, export map, peer dependency, `files`, `sideEffects`, generated declaration surface, or CSS delivery contract requires the matching root command (`pnpm test:dist:react` or `pnpm test:dist:vue`) before claiming compatibility.
