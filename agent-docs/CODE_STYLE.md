# Code Style

- 格式化与 lint 唯一来源：根 ESLint（`@antfu/eslint-config` v9，vue + react 预设）。`pnpm lint` 检查、`pnpm lint:fix` 即格式化 —— 仓库无独立 formatter，不要引入。
- 把变更限制在请求的行为内：不顺手重构、重命名、加防御性 fallback。
- 不为单一调用方抽取 helper/class/interface；至少三个调用方才抽象。
- React 深模块允许把复杂但同生命周期的实现保留在一个局部模块中；只有真实 seam、第二个生产调用方或独立 lifecycle owner 才能抽取，行数本身不是理由。
- 不复制工具：需要两个及以上文件使用的纯逻辑/类型，先查 `packages/core`（共享协议），或放进包内 `utils/` 的归属模块；**永远不要**在两库各写一份相同实现 —— 共享面见 `docs/behavior-spec.md`。
- 满足需求时优先用框架/已安装库提供的能力，不自造轮子。
- TS 中可自动推断类型的冗余标注严格禁止。
- 除非必要，函数定义必须使用箭头函数。
- 优先函数式：纯确定函数、显式数据流、不可变值、隔离副作用。
- 变量名简洁清晰，善用无歧义缩写（如 `getEnvironmentDirectory` → `getEnvDir`）。
- 仅在真正必要的地方编写简短而无歧义的单行注释，严禁注释泛滥，以代码本身为 SSOT。例如：eslint-disabled 规则；某个通用工具函数 & hook & composable 的作用。
