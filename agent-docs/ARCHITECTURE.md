# Architecture

pnpm workspace（`pnpm-workspace.yaml`）包含 `apps/*` 与 `packages/*`。根包只负责编排脚本；根 tsconfig 提供共享基线。包产权与依赖方向见 [PACKAGES.md](./PACKAGES.md)。

## 独立框架模块

Vue 与 React 共享框架无关的行为结果，不追求物理目录、状态机或公开 API 对称。两端可以采用各自框架最容易局部推理的实现，并独立验证、发布。

React 生产源码固定为：

```text
packages/react/src/
├── HanaImgViewer.tsx
├── index.ts
├── internal/
│   ├── ViewerOverlay.tsx
│   └── viewerReducer.ts
├── public-types.ts
├── style.css
└── vite-env.d.ts
```

- `HanaImgViewer.tsx` 是唯一公开 seam：标准化 props，固定 controlled/uncontrolled ownership，持有 lifecycle reducer，渲染 thumbnail/children，并解析 hydration 后的 container。
- `internal/ViewerOverlay.tsx` 局部拥有 portal、图片增强、FLIP/WAAPI、body lock、焦点、Escape、resize、transform ref、RAF writer 与唯一 gesture owner。
- `internal/viewerReducer.ts` 只包含 `closed/opening/open/closing` 与纯 transition，不持有 DOM、callback、source、transform 或 timer。
- `public-types.ts` 只声明 `HanaImgViewerProps`；`index.ts` 只导出组件、Props 类型并导入 CSS。

React 用 state/reducer 表达 JSX 可见状态，用 ref 保存 DOM 邻近的高频瞬时状态。用户意图从 event handler 发出；DOM 测量与动画位于可清理的 layout effect。禁止重新引入 lifecycle `flushSync`、microtask bridge、getter/ref bus 或按帧 React state。

Vue 生产源码固定为：

```text
packages/vue/src/
├── HanaImgViewer.vue
├── index.ts
├── internal/
│   ├── ViewerOverlay.vue
│   ├── bodyLock.ts
│   └── viewerState.ts
├── public-types.ts
├── style.css
└── vite-env.d.ts
```

`HanaImgViewer.vue` 拥有 `defineModel`、thumbnail/slot、hydration 后 target normalization、active target 与 focus restore；`internal/ViewerOverlay.vue` 局部拥有一次 overlay session 的 DOM、source、animation、gesture、focus 与 cleanup；`viewerState.ts` 只含纯 transition；`bodyLock.ts` 是唯一跨实例 body owner seam。Vue 不再从单调用方 composable lattice 公开或导入 lifecycle helper。

## 依赖与工具链边界

- `hana-img-viewer-core` 只承载已经被实际复用的纯数学、输入解析、DOM 数值工具与类型；框架 lifecycle、Animation ownership 和 effect orchestration 不进入 core。
- `@` alias 在各自 Vite/Vitest/tsconfig 中指向本包 `src`；跨包引用只走包名。
- TypeScript 全仓统一 6.0.3。Vue 用 vue-tsc，React 用 tsc。
- 两库分别用 unplugin-dts/vite-plugin-dts 生成声明。不要启用 `bundleTypes`，避免 Vue VLS slot 类型丢失符号。

## 产物约束

- 两个 UI 包均保持 ESM-only、extracted `style.css`、source map 与 framework external。
- 消费者显式 import `style.css`；dist-contract 断言 CSS 无运行时注入。
- 框架无关行为及逐端 conformance 见 `docs/behavior-spec.md`。框架特定 API 见各自公开文档。
