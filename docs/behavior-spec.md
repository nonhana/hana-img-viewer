# Hana Img Viewer Behavior Specification

This document is the source of truth for observable behavior shared by the Vue and React implementations of Hana Img Viewer. A feature that changes a shared result MUST update this specification and the affected implementation's conformance evidence in the same change.

The root [`README.md`](../README.md) remains the source of truth for framework-specific public API names, defaults, and examples. The files under [`agent-docs/`](../agent-docs/) define code ownership and repository boundaries. Those documents may describe different interfaces or internal designs, but they MUST NOT redefine a shared result in this specification.

## Scope and Conformance

The contract is behavioral, not structural:

- Vue and React MUST produce the shared observable results below.
- They MAY use different props, events, state models, lifecycle primitives, module layouts, and release schedules.
- Conformance is established independently for each registered adapter. A framework is conformant only when every applicable root Vitest project passes.
- Shared behavior tests use the `[behavior/Bx]` prefix. Framework-only interface tests use an implementation-specific prefix.
- A shared behavior change MUST define its minimum evidence before the implementation is treated as conformant.

The normative terms **MUST**, **MUST NOT**, **SHOULD**, and **MAY** are used as defined by RFC 2119.

### Contract Boundary

This contract is an agreement about observable behavior, not a requirement that the implementations share internal structure.

- The contract defines results that a consumer or host can observe through the public interface: rendered state, events, focus, geometry, transforms, source changes, portal ownership, cleanup, server output, hydration, and published artifacts.
- React and Vue MAY use different idiomatic state models, lifecycle primitives, DOM organization, scheduler boundaries, effect ownership, and cleanup mechanisms.
- Contract evidence MUST assert those observable results through each framework's public seam. It MUST NOT require matching hooks, reducers, composables, component trees, private helpers, or internal state transitions.
- An internal difference is not a conformance issue unless it changes a normative observable result. Conversely, equivalent-looking internal code does not establish conformance without the required observable evidence.

### Terms

| Term | Meaning |
| --- | --- |
| Origin | The visible thumbnail root and its thumbnail trigger. |
| Overlay | The mounted dialog, backdrop, preview shell, and preview image. |
| Desired visibility | The open or closed state requested by the local component or its external owner. |
| Session | The period from mounting an overlay in a resolved container until that overlay is unmounted. |
| Baseline transform | `translate3d(0px, 0px, 0) scale(1)`. Scale `1` remains the reset target even when it falls outside the configured zoom range. |
| Pending container | An explicit `null` container. Desired visibility may be open, but no overlay session exists until an element is provided. |

## Shared Behavior Contract

Normative results include the cross-framework alignment decisions confirmed on 2026-08-23. Executable evidence is owned by the root contract suite and its registered framework adapters.

| ID | Behavior | Normative result | Minimum conformance evidence |
| --- | --- | --- | --- |
| B1 | Open and close lifecycle | Without a mounted overlay, only the origin is rendered. An open request with a resolved container mounts the overlay and hides the origin. After an accepted close request finishes, the overlay is unmounted and the origin is visible again. | A public trigger produces an origin-only → overlay-mounted → origin-only DOM sequence through real open and dismiss events. |
| B2 | Visibility ownership and reversal | Externally owned visibility MUST wait for owner confirmation. Locally owned visibility MUST update itself. Synchronizing external state MUST NOT echo a new change request. An opposite desired visibility received during `opening` or `closing` MUST reverse the active transition, and stale completions MUST be ignored. | Controlled close remains open before confirmation and does not echo on synchronization; active `opening → closing` and `closing → opening` paths are exercised. |
| B3 | Wheel and trackpad zoom | While the session is open, wheel or trackpad input MUST zoom around the event point, use the actual overlay viewport as its coordinate space, and clamp scale to `minZoom` and `maxZoom`. Remeasurement MUST NOT reset the current transform. | Real wheel events prove anchored scale and translation, both bounds, transform preservation after remeasurement, and custom-container coordinates. |
| B4 | Pinch zoom and gesture ownership | While the session is open, the distance between two touches MUST control scale around their midpoint. Starting a pinch MUST terminate an active pointer drag and give pinch sole gesture ownership until fewer than two touches remain. | Real pointer and two-touch events show pinch taking ownership from drag and changing scale. |
| B5 | Pointer drag | Pointer drag MUST be available while the session is open. Dragging MUST pan independently of scale, including at and below scale `1`. Zoom-bound changes MAY clamp scale but MUST preserve translation. Remeasurement while the phase remains open MUST preserve active pointer ownership and allow the current drag to continue. Leaving the open phase MUST release pointer ownership and cancel gesture listeners and pending frame writes. | Real pointer events pan at scale `1` and below `1`; a dynamic zoom-bound clamp preserves `x` and `y`; `pointerdown → remeasure → pointermove` continues the same drag. |
| B6 | Double-click zoom reset | While the session is open, double-click MUST toggle between baseline scale `1` and `clamp(2, minZoom, maxZoom)`. Returning to baseline MUST reset translation. Baseline `1` MUST remain reachable even when the configured range excludes it. | Two double-clicks return to the baseline with default bounds and with valid ranges entirely above or below `1`. |
| B7 | FLIP transition ownership | Opening and closing MUST animate between distinct origin and preview geometry while the backdrop transitions in parallel. Remeasurement during `opening` or a reversed reopening MUST replace the obsolete animation, continue from the current computed visual state, target the latest geometry, and use only that opening run's remaining duration. Reopening after an interrupted close MUST preserve the session's zoom and pan as its visual target. Only the current transition owner may complete the phase; replaced or unmounted animations MUST be cancelled. | Public-seam tests inspect distinct FLIP keyframes; remeasurement continues from the current matrix for only the remaining duration; reversed reopening preserves zoom and pan across another remeasurement; obsolete animations cannot complete the phase; a configured `transitionDuration` runs every FLIP animation at that duration. |
| B8 | Source replacement within a session | Changing `src`, changing `previewSrc`, or removing `previewSrc` MUST synchronously return the preview to the current base `src` before a new enhancement may apply. Any source-tuple change MUST invalidate older pending enhancement results so that only the latest source generation may apply. A replacement thumbnail load MUST trigger geometry remeasurement. | Each source-tuple change immediately displays the base; an older pending completion is ignored; only the latest completion applies; thumbnail load remeasures the shell. |
| B9 | Silent source enhancement | A session MUST begin with `src`. A distinct `previewSrc` MAY silently replace it only after a successful image load; decoding is best-effort. Failure MUST retain the current base source, including after a previous enhancement was displayed or the enhancement source changed. A later session MUST retry. Enhancement success or failure MUST NOT reset the current transform. | Success replaces the base without exposing loading state; failure after initial load and after a source replacement retains the base; reopening retries. |
| B10 | Keyboard, focus, and dismissal | The default trigger MUST open with Enter and Space. Opening MUST move focus into the overlay. An enabled Escape or backdrop path MUST request close and contain the handled event; a disabled path MUST remain available to the host. A shown close button MUST request close when clicked; hiding it MUST remove the button from the overlay. Closing MUST restore focus to the default trigger. | With two instances open, Escape closes only the focused overlay; closing restores focus to the default trigger; disabled dismissal paths remain open; the close button requests close and is omitted when hidden. |
| B11 | Mount container lifecycle | An omitted container MUST resolve to `document.body` after hydration; explicit `null` MUST remain pending; an element MUST receive the overlay. Pending state MUST NOT hide the origin, lock the body, or mount overlay markup. When the requested container changes during a session, the viewer MUST complete the closing transition in the old container before unmounting it and releasing its side effects. If visibility is still desired and a new element is available, a new opening transition MUST then begin in that element. Geometry and zoom anchoring MUST use the active container viewport. | `pending → custom` and `body → custom → pending` transitions prove that the old portal remains through closing, side effects release only after completion, the new portal opens afterward, and geometry follows the active container. |
| B12 | Body scroll lock | Only an overlay actually mounted to `document.body` may own the body lock. Multiple owners MUST be reference-safe. Final cleanup MUST restore only the styles still owned by the viewer and MUST NOT overwrite host changes made while the lock was active. | Two body-mounted instances close in sequence; the lock survives the first close and final cleanup preserves a host style write. |
| B13 | SSR and hydration | Server output and the first hydration snapshot MUST contain only the origin, even when desired visibility is open. Container resolution and portal creation MUST begin only after the client commit. Hydration and lifecycle replay MUST NOT produce mismatch warnings, leaked overlays, locks, listeners, or animations. | Closed and open SSR output contain no overlay; hydration first preserves origin-only markup and then mounts exactly one client overlay without leaked effects. |
| B14 | Distribution and styles | Each UI package MUST publish ESM output with an extracted stylesheet. JavaScript MUST NOT inject CSS at runtime. Package metadata, runtime exports, and reachable public declarations MUST match the framework's documented public surface. | A fresh build and distribution-contract suite verify artifacts, CSS extraction, metadata, runtime identity, and declaration exports. |

## Framework Interface Mapping

The same behavioral concept may be expressed differently by each framework. The complete public surfaces remain documented in the root [`README.md`](../README.md).

| Concept | Vue | React |
| --- | --- | --- |
| Visibility ownership | `v-model:open` and the `update:open` event. An omitted model uses local state; a provided model is owned by the host. | `open` selects controlled ownership when defined on the first render. `defaultOpen` initializes local ownership, and `onOpenChange` reports requests. Ownership MUST NOT switch during a mount. |
| Container | `container?: HTMLElement \| null`; omission means body after mount and `null` means pending. | `container?: HTMLElement \| null`; omission means body after hydration and `null` means pending. |
| Dismissal | `closeOnBackdropClick` and `closeOnEscape` decide whether the viewer consumes and handles those paths. | `closeOnBackdropClick` and `closeOnEscape` decide whether the viewer consumes and handles those paths. |

Selector strings are not supported by either UI package, even though `hana-img-viewer-core` still exposes selector-aware portal utilities for its own independent API compatibility.

## Deliberately Excluded Behavior

The current shared contract does not include:

- a complete focus trap or a nested dismissable-layer stack;
- `prefers-reduced-motion` behavior;
- galleries, slide navigation, captions, toolbars, downloads, or sharing;
- selector-based mount targets;
- identical framework APIs, internal module shapes, lifecycle abstractions, or package versions.

Adding any of these as a cross-framework requirement requires a new behavior ID or an explicit revision to an existing one before implementation.

## Shared Implementation Boundary

[`packages/core`](../packages/core/) contains only framework-independent logic that is genuinely reused, such as clamping, anchored zoom math, touch metrics, trackpad detection, scrollbar and aspect-ratio calculations, and image preloading.

Framework lifecycle state, gesture ownership, animation ownership, portal orchestration, focus handling, and effects remain inside their respective UI packages and should follow each framework's idiomatic design. Physical symmetry, a shared lifecycle state machine, and identical internal ownership boundaries are not conformance requirements.

## Evidence Locations

| Layer | Evidence |
| --- | --- |
| Shared behavior | `tests/contracts/dom/behaviors/` |
| Server rendering | `tests/contracts/server/b13-server-render.ts` |
| Hydration | `tests/contracts/hydration/b13-hydration.ts` |
| Distribution | `tests/contracts/distribution/b14-distribution.ts` |
| Framework adapters | `tests/adapters/react/` and `tests/adapters/vue/` |

The demos under `apps/` are manual interaction smoke tests. They consume source aliases and do not establish distribution conformance.
