# Packages

单仓库包含三个库包与两个 private demo。每个库拥有独立接口、实现与语义版本。

## 包清单与产权

| 路径 | 发布名 | 状态 | 产权 |
| --- | --- | --- | --- |
| `packages/vue` | `hana-img-viewer` | 已发布，v4.x | Vue 3 库；Vue 专属实现留在本包。 |
| `packages/react` | `hana-img-viewer-react` | 未发布，首次 1.0.0 待准备 | React 19 深模块；接口见 `docs/react-api.md`。 |
| `packages/core` | `hana-img-viewer-core` | 未发布，首次 1.0.0 待准备 | 已被实际复用的框架无关纯逻辑/类型。 |
| `apps/vue-demo` | `hana-img-viewer-demo-vue` | private | 只消费 Vue 库。 |
| `apps/react-demo` | `hana-img-viewer-demo-react` | private | 只消费 React 库。 |

## 依赖方向

- `apps/*` → 对应库源码入口；demo 不承载库实现，也不发布。
- Vue/React 库 → `hana-img-viewer-core`（`dependencies: workspace:*`）。
- core 不依赖框架；库不得引用另一个框架库或反向引用 app。
- 框架 peer 仍归各 UI 包所有；不增加第二套 runtime framework dependency。

共享不是目标本身。纯函数或类型只有在两个生产实现真实复用且不会泄漏框架 lifecycle 时才进入 core。React reducer、gesture owner、Animation ownership 与 effects 必须留在 React 包；不设“共享交互状态机”里程碑。

## 独立版本与发布集合

- `.changeset/config.json` 使用 `fixed: []`；demo 保持 ignore。
- Changesets 仅因真实包变更及 workspace dependency 更新决定 bump，不强制三包同版。
- core 更新可按 `updateInternalDependencies: patch` 触发依赖方 metadata patch。
- 当前源码 pre-version 为 React/core `0.0.0`；预期 Release PR 为 React/core `1.0.0`、Vue `4.0.1` dependency metadata patch。
- `pnpm changeset version`、commit、push、publish、tag 与 GitHub release 都需要单独授权；常规实现只运行 status、build、test 与 pack dry-run。
