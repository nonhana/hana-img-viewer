# Public API

Vue 已发布库 + React/core 首次发布待准备。外部支持面由各包 `exports` map 固定，dist-contract 套件守护。

## `hana-img-viewer`（Vue）

- `exports["."]` → `./dist/index.js`（types `./dist/index.d.ts`）；无 CJS 构建。
- `exports["./style.css"]` → `./dist/style.css`；`sideEffects: ["**/*.css", "src/index.ts"]`。
- `files: ["dist"]`。
- 导出：default 与具名 `HanaImgViewer` 是同一个带 `install(app)` 的组件引用；类型只有 `HanaImgViewerProps`。
- `HanaImgViewerProps` 只有 `src`、`previewSrc`、`alt`、`open`、`container?: HTMLElement | null`、`enableZoom`、`minZoom`、`maxZoom`、`closeOnBackdropClick`、`closeOnEscape`；事件只有 `update:open`，slot 只有 `thumbnail`。
- Peer：`vue` ^3.5.0；dependencies：`hana-img-viewer-core`。不再依赖 `@vueuse/core`。

## `hana-img-viewer-react`

- `exports["."]` → `./dist/index.js`（types `./dist/index.d.ts`）；`exports["./style.css"]` 同名结构；`sideEffects: ["**/*.css"]`；`files: ["dist"]`。
- 导出面只有 default + 具名 `HanaImgViewer` 与类型 `HanaImgViewerProps`；不 re-export core/internal 类型。
- 无 imperative ref/controller、selector portal、兼容 alias 或额外生命周期/图片事件。完整 props 契约见 `docs/react-api.md`。
- 当前尚未公开发布，源码 manifest pre-version 为 0.0.0，首次 Release PR 目标为 1.0.0。
- Peer：`react` / `react-dom` ^19.0.0；dependencies：`hana-img-viewer-core`。

## `hana-img-viewer-core`

- 源码形式发布：`exports["."]` → `./src/index.ts`（types 同）；`files: ["src"]`。
- 当前尚未公开发布，源码 manifest pre-version 为 0.0.0，首次 Release PR 目标为 1.0.0。
- 导出：`getDistance`、`getMidpoint`、`getZoomAnchoredPosition`、`clamp`、`createTrackpadDetector`、`getTwoTouches`、`getTouchMetrics`、`createPinchState`、`isHTMLElement`、`isBodyPortalTarget`、`resolvePortalTarget`、`getScrollbarWidth`、`resolveAspectRatio`、`loadImage`；类型 `Point`、`Transform`、`ViewerTransformAnchor`、`ViewerInteractionPhase`、`ViewerSourcePhase`、`PortalTarget`、`WheelState`、`PinchState`、`DEFAULT_TRANSFORM`。
- 通常不作为消费者直接依赖，由两库 dependency 引入；版本按实际 core/API 与 workspace dependency 影响独立计算。

## 契约（dist-contract 断言）

- 各 dist 必须包含 `index.js` / `index.d.ts` / `style.css`。
- JS 产物不得运行时注入 CSS（无 `document.createElement('style')` / `document.head.appendChild`）。
- exports map 与 `sideEffects` 保持精确值。
- React dist 的 default/具名组件必须同一引用，root declaration graph 只能触达 `HanaImgViewerProps`，legacy 类型名必须缺席。

改以上任一文件、构建配置或 package.json 字段后，跑 `pnpm test:dist` 再宣称导出面完好。
