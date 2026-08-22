# PACKAGES.md

单仓库四包：两个已发布库 + 一个共享 core + 两个私有 demo。所有权与依赖规则如下。

## 包清单与产权

| 包（路径） | 发布名 | 状态 | 产权 |
| --- | --- | --- | --- |
| `packages/vue` | `hana-img-viewer` | 已发布，v4.x | Vue 3 库；只属于本目录的代码不可换目录 |
| `packages/react` | `hana-img-viewer-react` | 已发布，v4.x | React 19 库；同上 |
| `packages/core` | `hana-img-viewer-core` | 已发布，v4.x | 共享纯逻辑/类型；**两库共有的纯函数与类型只能在这里** |
| `apps/vue-demo` | `hana-img-viewer-demo-vue` | private | Vue 演示；只消费库，不承载库实现 |
| `apps/react-demo` | `hana-img-viewer-demo-react` | private | React 演示；同上 |

## 依赖方向（强制）

- `apps/*` → 库包（dev-time，Vite alias 指向库 `src/index.ts`，永不消费 dist）
- 库包 → `hana-img-viewer-core`（`dependencies: workspace:*`，发布时 changesets 改写版本号）
- `packages/core` 不依赖任何框架（Vue/React 对其均为零依赖）
- 任何包不得反向引用 `apps/`；库源码不得引用另一个库
- 不被覆盖的事实：三库 `dependencies` 只有 core 一项运行时依赖；框架均为 `peerDependencies`

## 版本联动（changesets fixed）

- `.changeset/config.json`：`fixed: [["hana-img-viewer", "hana-img-viewer-react", "hana-img-viewer-core"]]` —— 任一方发布，三包同版本号
- demo 在 `ignore` 列表，永不 bump
- 变更纪录：`pnpm changeset` 生成；`pnpm changeset version` 仅演练用（真实版本由 Release PR 消费）
- 依赖升级方向：core 变更 → 双库 patch 升 core 引用（`updateInternalDependencies: patch`）

## 共享面规则

- 需要两库共用的**纯逻辑/类型**（数值计算、DOM/手势处理、阶段/几何与交互状态类型）：进 `packages/core/src/`，双库从 `hana-img-viewer-core` import；禁止在两库各写一份相同实现（`docs/behavior-spec.md` 的"共享面"一节列出当前已收敛项）
- 框架特定工具留在各库 `utils/helpers.ts`（Vue 侧 re-export @vueuse，React 侧本地 `isClient`）
- 交互状态机（useFLIP/useDrag/usePinch/useWheel）尚未共享，是下一里程碑（L2）；当前以行为契约双端平行实现