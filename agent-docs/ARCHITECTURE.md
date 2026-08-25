# Architecture

## Workspace Boundaries

The pnpm workspace contains `apps/*` and `packages/*`. The root package orchestrates workspace commands and provides the shared TypeScript and ESLint baselines.

- `packages/vue` owns the Vue component, Vue-specific lifecycle, and Vue package output.
- `packages/react` owns the React component, React-specific lifecycle, and React package output.
- `packages/core` exposes framework-independent DOM, input, math, and shared types. It must not own framework lifecycle, portal orchestration, animation ownership, or effects.
- `apps/demo` is a private MPA consumer. It demonstrates both UI libraries' source behavior and must not own library implementation.

Both UI libraries use the private `hana-img-viewer-core` workspace package while developing and building. Vite bundles those imports into each public UI package, so consumers never install core as a runtime dependency. Core does not depend on either framework, and neither UI library may import the other UI library or an app. Local `@/*` aliases resolve to the current package's `src`; cross-package imports use package names.

## Shared Results, Independent Implementations

[`docs/behavior-spec.md`](../docs/behavior-spec.md) is the source of truth for framework-independent observable results and per-framework conformance. Update the relevant behavior and minimum assertion before changing a shared result.

Vue and React do not require matching public props, physical layouts, state machines, or lifecycle abstractions. A framework-specific change can ship independently, but its tests and conformance status must remain accurate. Core exports such as selector-aware portal helpers do not expand the supported Vue or React container APIs.

## Root Contract Test Seam

- `tests/contracts/**` is the executable conformance layer for B1-B14. It is test architecture, not a production runtime or `ViewerContract` abstraction.
- `tests/adapters/react/**` and `tests/adapters/vue/**` map each public source seam to the same shared contracts. Adapters own mount/update/settle/lookup/request history/unmount only.
- `tests/environment/dom.setup.ts` owns deterministic browser controls and complete per-test cleanup. Framework scheduler details remain inside adapters.
- UI packages retain only pure transition unit tests; adding a framework requires adapters and root Vitest projects without copying behavior bodies.

## React Ownership

- `src/HanaImgViewer.tsx` is the public seam. It normalizes props, fixes controlled or uncontrolled ownership at mount, gates portal creation until hydration, owns the phase reducer, renders the trigger, and resolves the active container.
- `src/internal/ViewerOverlay.tsx` owns one mounted overlay session: the portal, source enhancement, FLIP/WAAPI transitions, body locking, focus, dismissal, measurement, gestures, transforms, and cleanup.
- `src/internal/viewerReducer.ts` is a pure `closed` / `opening` / `open` / `closing` transition module. It does not own DOM, callbacks, sources, transforms, or timers.
- `src/public-types.ts` declares the public props; `src/index.ts` exports the component and props type and imports the stylesheet.

Keep JSX-visible lifecycle in React state or the reducer. Keep high-frequency DOM-adjacent interaction state, animation identities, and frame writers local to the overlay. Do not reintroduce lifecycle `flushSync`, microtask bridges, ref buses, or single-caller hook lattices.

## Vue Ownership

- `src/HanaImgViewer.vue` owns `v-model:open`, thumbnail and slot rendering, hydration-aware Teleport target selection, the active target, and focus restoration.
- `src/internal/ViewerOverlay.vue` owns one overlay session's DOM, source enhancement, animation, gestures, focus, dismissal, and cleanup.
- `src/internal/viewerState.ts` contains only pure phase transitions; `src/internal/bodyLock.ts` is the cross-instance body-lock ownership seam.
- `src/public-types.ts` declares public props; `src/index.ts` creates the installable component identity, exports it as default and named, exports the props type, and imports the stylesheet.

Do not move Vue lifecycle work into core or rebuild a composable lattice for single production callers.
