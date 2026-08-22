# Testing

Vitest 4；每个套件独立 config。两库测试文件从各自 `tests/support/vitest.ts` 导入 Vitest API（不直接 import `vitest`）；core 直接使用 vitest（无框架）。

## 套件一览（8 + core = 9）

| Suite | 归属 | 环境 | 入口 |
| --- | --- | --- | --- |
| unit | 两库 | jsdom / node | `vitest.unit.config.ts` |
| component | 两库 | jsdom + setup | `vitest.component.config.ts` |
| ssr | 两库 | node | `vitest.ssr.config.ts` |
| dist-contract | 两库 | node（先 build） | `vitest.dist.config.ts` |
| core | `packages/core` | node | `vitest run` |

根命令：`pnpm test`（core + 两库 unit/component/ssr）、`pnpm test:dist`（先双包 build 再 dist 契约）。

## Component-suite setup（两库各自）

`tests/setup/component.setup.ts` 仅在 component 套件加载，mock 浏览器 API 并在 `afterEach` 重置：

- `window.Image` — 通过 setup 导出的 `setImageSequence` / `resolvePendingImage` / `getImageRequestCount` 控制加载/失败。
- `HTMLElement.prototype.animate` — `setAnimationSequence` / `resolvePendingAnimation` / `getAnimationCalls`。
- `getBoundingClientRect` stub + `addEventListener`/`removeEventListener` spies。

## 契约与注意

- 行为测试按 [docs/behavior-spec.md](../docs/behavior-spec.md) 的 `behavior/<id>` 组织；**新行为必测双端 component 套件**。
- SSR 套件在 node 环境：证明无浏览器时的渲染行为，非视觉正确性。
- UI 冒烟：`pnpm dev:vue` / `pnpm dev:react` 起 demo，验证 open/preview/close 等交互（demo 解析源码 alias，非 dist）。
- dist 契约守护 PUBLIC_API.md 的完整导出面；build 配置、exports、CSS 提取变化后必须 `pnpm test:dist`。