# Build

Package manager is pnpm, pinned to `11.21.0` via `packageManager` in the root `package.json`. Dependencies come from `pnpm-workspace.yaml` catalogs: root `catalog`（共享工具链）, `catalog:ui-vue`, `catalog:ui-react`（框架分域）. Install with `pnpm install`.

## Commands

Run from the repo root.

| Command | Effect |
| --- | --- |
| `pnpm dev:vue` | Starts `apps/vue-demo` Vite dev server (aliases `hana-img-viewer` to `packages/vue/src/index.ts`). |
| `pnpm dev:react` | Starts `apps/react-demo` Vite dev server (aliases `hana-img-viewer-react` to its `src/index.ts`). |
| `pnpm build` | Recursive build, serial: two libraries + two demos. |
| `pnpm typecheck` | Vue: `vue-tsc --noEmit` on `packages/vue`; React: `tsc --noEmit` on `packages/react`. |
| `pnpm lint` / `pnpm lint:fix` | Root ESLint (antfu v9, vue + react 预设，lint 即格式化)；`lint:fix` 等价 `fmt`。无独立 formatter。 |
| `pnpm test` | Recursive unit + component + ssr suites（两库 ×3 + core）。 |
| `pnpm test:dist` | Builds then runs dist-contract suites for both libraries. |
| `pnpm changeset` | Create a changeset（发布走 changesets fixed 三包联动）。 |

## Build output

`packages/vue/dist/` 与 `packages/react/dist/`（各包 `files` 仅发布 `dist`）：

- `index.js` — 单一 ES-module 产物（library format `es` only），minified；`vue` / `react`+`react-dom` 等框架为 external，`hana-img-viewer-core` 源码在构建时内联进 bundle。
- `style.css` — 提取后的样式表（`cssCodeSplit: false`；JS 无运行时注入）。
- `index.d.ts` — 各包 dts 插件生成（Vue: `unplugin-dts`；React: `vite-plugin-dts`）。**导出的类型自包含**：`hana-img-viewer-core` 作为两库的 `dependencies` 发布，d.ts 中对它的引用合法。

dist 契约由两包 `tests/dist-contract` 断言（`pnpm test:dist`）。