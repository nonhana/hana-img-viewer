# Public API

The root [`README.md`](../README.md) is the single source of truth for consumer-facing Vue and React API descriptions and examples. Keep it aligned with the package manifests, `src/public-types.ts`, runtime exports, and distribution-contract tests; do not create a second framework API document.

## UI Package Surfaces

Both UI packages are ESM-only. Their package roots resolve to `dist/index.js` with `dist/index.d.ts`, and their stylesheets are separate `./style.css` exports. Consumers must import the stylesheet explicitly.

`hana-img-viewer` exposes:

- default and named `HanaImgViewer` as the same installable Vue component identity;
- the `HanaImgViewerProps` type;
- only the `update:open` event and `thumbnail` slot described in the root README.

Its `sideEffects` contract is `['**/*.css', 'src/index.ts']`, its peer is Vue `^3.5.0`, its package files are limited to `dist`, and it has no runtime dependency on the private core workspace package.

`hana-img-viewer-react` exposes:

- default and named `HanaImgViewer` as the same component identity;
- the `HanaImgViewerProps` type;
- no imperative controller, selector portal, compatibility aliases, lifecycle callbacks, source callbacks, or core/internal type re-exports.

Its `sideEffects` contract is `['**/*.css']`, its peers are React and React DOM `^19.0.0`, its package files are limited to `dist`, and it has no runtime dependency on the private core workspace package.

The two frameworks may evolve different props and ownership models. In both current UI APIs, `container` accepts only `HTMLElement | null` when provided; the selector-aware core portal types are not UI package exports.

## Internal Core Surface

`hana-img-viewer-core` is private and is not a consumer API. It exports `src/index.ts` as a workspace build seam, and both public Vite builds inline the values they use. Do not publish core or expose it through either UI package's declarations or runtime manifest.

Changing a public UI export, export map, peer dependency, runtime dependency, `files`, `sideEffects`, `publishConfig`, generated declaration surface, or CSS delivery contract requires the matching root command (`pnpm test:dist:react` or `pnpm test:dist:vue`) before claiming compatibility.
