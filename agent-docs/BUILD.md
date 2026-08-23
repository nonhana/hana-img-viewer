# Build

包管理器是根 `package.json` 固定的 pnpm 11.21.0。依赖版本来自 `pnpm-workspace.yaml` 的 root、Vue 与 React catalogs。安装使用 `pnpm install`。

## 根命令

从仓库根目录执行：

| Command | Effect |
| --- | --- |
| `pnpm dev:vue` | 启动 `apps/vue-demo`，alias 到 Vue 源码入口。 |
| `pnpm dev:react` | 启动 `apps/react-demo`，alias 到 React 源码入口。 |
| `pnpm lint` / `pnpm lint:fix` | 根 ESLint 检查/格式化；`_notes/**` 属于 repo-owned ignore。 |
| `pnpm typecheck` | Vue 用 vue-tsc；React 用 tsc；demo 各自检查。 |
| `pnpm test` | core 与两库的 unit/component/SSR。 |
| `pnpm build` | 串行构建两库与两 demo。 |
| `pnpm test:dist` | 构建并运行两库 dist-contract。 |
| `pnpm changeset status` | 检查独立版本的待发布集合，不发布。 |

根质量门顺序固定为：`lint` → `typecheck` → `test` → `build` → `changeset status` → `test:dist`。

## Build output

`packages/vue/dist/` 与 `packages/react/dist/` 只作为各包 `files: ["dist"]` 的发布内容：

- `index.js`：ES module；Vue 或 React/React DOM external；所用 core 逻辑在构建时内联。
- `style.css`：`cssCodeSplit: false` 提取的样式，无 JS 运行时注入。
- `index.d.ts`：公开声明入口。
- `index.js.map`：运行时 source map。

React dist 还必须证明 default/named 组件引用相同，root declaration graph 只能暴露 `HanaImgViewerProps`。完整契约由两包 `tests/dist-contract` 断言。

版本独立管理；Changesets 不再把 Vue、React、core 固定成同一版本。React/core 源码 manifest 使用 0.0.0 pre-version，预期 Release PR 分别生成 1.0.0；当前 release contract 以 [PACKAGES.md](./PACKAGES.md) 为准。
