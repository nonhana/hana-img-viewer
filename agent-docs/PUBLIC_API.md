# Public API

两个发布库（均 v4.x，MIT）+ 共享 core。外部支持面由各包 `exports` map 固定，dist-contract 套件守护。

## `hana-img-viewer`（Vue）

- `exports["."]` → `./dist/index.js`（types `./dist/index.d.ts`）；无 CJS 构建。
- `exports["./style.css"]` → `./dist/style.css`；`sideEffects: ["**/*.css", "src/index.ts"]`。
- `files: ["dist"]`。
- 导出：default（带 `install` 的插件对象）+ 具名 `HanaImgViewer`；类型 `HanaImgViewerProps`、`HanaImgViewerEmits`、`HanaImgViewerExposed`（含 `types/utils` re-export 的 core 共享类型）。
- Peer：`vue` ^3.5.0、`@vueuse/core` ^14.0.0；dependencies：`hana-img-viewer-core`。

## `hana-img-viewer-react`

- `exports["."]` → `./dist/index.js`（types `./dist/index.d.ts`）；`exports["./style.css"]` 同名结构；`sideEffects: ["**/*.css"]`；`files: ["dist"]`。
- 导出面：default + 具名 `HanaImgViewer`；类型 `HanaImgViewerProps`、`HanaImgViewerHandle`、`PortalTarget`、`ThumbnailRenderProps`（含 `types/utils` re-export 的 core 共享类型）。
- Peer：`react` / `react-dom` ^19.0.0；dependencies：`hana-img-viewer-core`。

## `hana-img-viewer-core`

- 源码形式发布：`exports["."]` → `./src/index.ts`（types 同）；`files: ["src"]`。
- 导出：`getDistance`、`getMidpoint`、`getZoomAnchoredPosition`、`clamp`、`createTrackpadDetector`、`getTwoTouches`、`getTouchMetrics`、`createPinchState`、`isHTMLElement`、`isBodyPortalTarget`、`resolvePortalTarget`、`getScrollbarWidth`、`resolveAspectRatio`、`loadImage`；类型 `Point`、`Transform`、`ViewerTransformAnchor`、`ViewerInteractionPhase`、`ViewerSourcePhase`、`PortalTarget`、`WheelState`、`PinchState`、`DEFAULT_TRANSFORM`。
- 通常不作为消费者直接依赖 —— 由两库 dependency 引入；包名/版本经 changesets fixed 与两库同步。

## 契约（dist-contract 断言）

- 各 dist 必须包含 `index.js` / `index.d.ts` / `style.css`。
- JS 产物不得运行时注入 CSS（无 `document.createElement('style')` / `document.head.appendChild`）。
- exports map 与 `sideEffects` 保持精确值。

改以上任一文件、构建配置或 package.json 字段后，跑 `pnpm test:dist` 再宣称导出面完好。