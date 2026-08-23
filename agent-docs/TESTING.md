# Testing

Vitest 4。两库分别拥有 unit、component、SSR 与 dist-contract 配置；core 使用 node unit tests。框架测试从各自 `tests/support/vitest.ts` 导入 Vitest API。

## React ownership

- `tests/component/hana-img-viewer.component.test.tsx`：所有 lifecycle、source、portal、body lock、focus、animation 与 gesture 行为都经 `@/index` 公开 seam 验证。
- `tests/unit/viewer-reducer.unit.test.ts`：唯一允许越过公开 seam 的 React unit test，只验证纯 transition。
- `tests/ssr/hana-img-viewer.ssr.test.tsx`：证明 server thumbnail-only 输出。
- `tests/dist-contract/dist-contract.test.ts`：守护 runtime exports、Props-only declaration reachability、package metadata、CSS extraction 与 source map。

不要恢复 hook/component private-unit tests。纯数学/输入逻辑属于 core tests；React effect 与事件链属于 public component tests。

## Component setup

React `tests/setup/component.setup.ts` 提供并在 `afterEach` 重置：

- 图片 outcome 序列、pending resolve 与 request count；
- 多 Animation outcome/pending ownership 与调用记录；
- 按 element/selector 配置的不同 rect；
- pointer/touch event 构造、pointer capture 与 RAF；
- body/focus/window listener 可观察状态。

## 命名与验证

共享结果测试以 `[behavior/Bx]` 开头；React 接口专属断言以 `[react-interface/Rx]` 开头。behavior spec 的逐端状态只在对应公开测试存在时标为完成，不能以另一框架测试代替。

根验证：`pnpm lint` → `pnpm typecheck` → `pnpm test` → `pnpm build` → `pnpm changeset status` → `pnpm test:dist`。UI 冒烟用 `pnpm dev:react` / `pnpm dev:vue`；demo 消费源码 alias，不代表 dist 契约。
