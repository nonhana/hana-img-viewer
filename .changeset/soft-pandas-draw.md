---
'hana-img-viewer-react': patch
---

Declare the package entry in the `sideEffects` manifest field so bundlers no longer tree-shake the `import './style.css'` statement out of builds that consume the React source, aligning the React manifest with the Vue package. Previously, a production build (Vite 8 / Rolldown) dropped the stylesheet import from the entry and shipped pages without viewer styles.
