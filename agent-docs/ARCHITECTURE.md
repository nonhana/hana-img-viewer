# Architecture

pnpm workspace（`pnpm-workspace.yaml`）：`apps/*` + `packages/*`。根包只做编排（脚本全部委托）；根 tsconfig 是各包共享 base。包级产权与依赖规则见 [PACKAGES.md](./PACKAGES.md)。

## 双库源码布局（对称）

Vue `packages/vue/src` ↔ React `packages/react/src`：

- `index.ts` — 入口：默认 + 具名导出组件；re-export 公开类型；副作用 import `style.css`。
- `components/HanaImgViewer.vue` / `.tsx` — 唯一组件。
- Vue `composables/` ↔ React `hooks/` — 平行实现：`core/`（useFLIP/useDrag/usePinch/useWheel 手势基元）+ `viewer/`（useViewerPhase/useViewerSource/useViewerTransform/useViewerGeometry/useViewerInteractions/usePortalTarget/useBodyLock 状态编排）。
- `utils/helpers.ts` — 框架侧工具（Vue re-export @vueuse 的 isClient/tryOnScopeDispose；React 本地 `isClient`）。纯数值逻辑在 core，不在此重复。
- `types/` — 框架侧公开类型（props/emits），`types/utils.ts` re-export core 共享类型；`types/index.ts` 聚合。

`@` alias 在 Vite/Vitest/tsconfig 中解析到各自包 `src`；包内 import 一律用 `@`，跨包引用一律走包名。

## 依赖与工具链边界

- 框架无关的数学/类型：`hana-img-viewer-core`（源码形式发布，`exports` → `src/index.ts`）；两库构建时将其逻辑内联进各自 dist，类型经 dist d.ts 引用该 dependency。
- TypeScript 全仓统一 6.0.3（根 catalog `typescript: 6.0.3` + `overrides` 钉住 vite-plugin-dts 的 peer）。Vue 域用 vue-tsc，React 域用 tsc——框架绑定层双轨，不算第二套基建。
- dts 生成：两库各自 vite 配置内 unplugin-dts/vite-plugin-dts（同一实现）。**不要启用 `bundleTypes`**：`.vue` 组件的 VLS slot 类型会丢符号。

## 运营约束

- CSS 是副作用导入（两侧 `sideEffects` 声明含 `**/*.css`）：消费者必须显式 import `style.css`；构建必须保持提取（dist-contract 断言）。
- `packages/vue` 的入口 `src/index.ts` 因真实导入 `style.css` 列入其 `sideEffects`（React 入口无此需求）。
- 双框架行为契约：`docs/behavior-spec.md`；行为变更必须先在 spec 更新条目，再双端同发。
- 版本：changesets `fixed` 三包联动（PACKAGES.md）；demo 永不发布。