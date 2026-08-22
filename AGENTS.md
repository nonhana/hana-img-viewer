# hana-img-viewer

Vue 3 与 React 19 双框架图像预览组件的单仓库双包源码（Vue 库 + React 库 + 共享 core + 双 demo）。

## Agent Docs

- [BUILD.md](./agent-docs/BUILD.md) — 安装、启动、构建或发布前
- [TESTING.md](./agent-docs/TESTING.md) — 选择验证方式或改测试前
- [ARCHITECTURE.md](./agent-docs/ARCHITECTURE.md) — 改模块边界、源码布局或工具链前
- [PACKAGES.md](./agent-docs/PACKAGES.md) — 涉及包产权、依赖方向或发布版本联动前
- [PUBLIC_API.md](./agent-docs/PUBLIC_API.md) — 改包导出面、exports map 或 dist 产物前
- [CODE_STYLE.md](./agent-docs/CODE_STYLE.md) — 写代码前

行为契约（双框架等价性）见 [docs/behavior-spec.md](./docs/behavior-spec.md)：行为变更必须先更新 spec 条目，再双端同发。