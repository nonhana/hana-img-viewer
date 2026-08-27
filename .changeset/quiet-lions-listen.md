---
"hana-img-viewer": minor
"hana-img-viewer-react": minor
---
Adjust the public API: remove the custom trigger interface and the `enableZoom` prop, and add `showCloseButton` and `transitionDuration`.

- Remove the custom trigger interface. The viewer always renders its own thumbnail image as the trigger with click, Enter, and Space handling; Vue no longer provides a `thumbnail` slot and React function `children` no longer render a custom trigger.
- Remove the `enableZoom` prop. Wheel, pinch, double-click, and drag interactions are always enabled; constrain the zoom range with `minZoom` and `maxZoom`.
- Add `showCloseButton` (default `true`) to render an explicit close button in the top-right corner of the overlay.
- Add `transitionDuration` (default `300`) to control the open and close FLIP transition duration in milliseconds.
