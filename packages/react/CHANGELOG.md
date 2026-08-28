# hana-img-viewer-react

## 1.1.0

### Minor Changes

- [#19](https://github.com/nonhana/hana-img-viewer/pull/19) [`b3b5209`](https://github.com/nonhana/hana-img-viewer/commit/b3b52098267e639e9f54196e86839e441a98a86f) Thanks [@nonhana](https://github.com/nonhana)! - Adjust the public API: remove the custom trigger interface and the `enableZoom` prop, and add `showCloseButton` and `transitionDuration`.
  
  - Remove the custom trigger interface. The viewer always renders its own thumbnail image as the trigger with click, Enter, and Space handling; Vue no longer provides a `thumbnail` slot and React function `children` no longer render a custom trigger.
  - Remove the `enableZoom` prop. Wheel, pinch, double-click, and drag interactions are always enabled; constrain the zoom range with `minZoom` and `maxZoom`.
  - Add `showCloseButton` (default `true`) to render an explicit close button in the top-right corner of the overlay.
  - Add `transitionDuration` (default `300`) to control the open and close FLIP transition duration in milliseconds.

## 1.0.1

### Patch Changes

- [#15](https://github.com/nonhana/hana-img-viewer/pull/15) [`64df65d`](https://github.com/nonhana/hana-img-viewer/commit/64df65df30ae736f73231407989ed1063d88face) Thanks [@nonhana](https://github.com/nonhana)! - Refactoring the architectural design of hana-img-viewer

## 1.0.0

### Major Changes

- [#11](https://github.com/nonhana/hana-img-viewer/pull/11) [`127ad04`](https://github.com/nonhana/hana-img-viewer/commit/127ad04703216685de3edaeb21fcd88406f28885) Thanks [@nonhana](https://github.com/nonhana)! - Publish the first stable React implementation with an idiomatic controlled/uncontrolled interface, render-prop trigger, HTMLElement container, independent drag and zoom interactions, SSR-safe hydration, and the shared behavior contract expected from the Vue package.

- [#13](https://github.com/nonhana/hana-img-viewer/pull/13) [`3e335d2`](https://github.com/nonhana/hana-img-viewer/commit/3e335d2cb6cc84cdaa17643e72f5bd3993e2bb3d) Thanks [@nonhana](https://github.com/nonhana)! - Create a new contract and synchronize the behavior with the Vue version of hana-img-viewer.
