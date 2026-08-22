# hana-img-viewer 行为规格（Behavior Spec）

> 本文件是双框架实现（`hana-img-viewer` Vue / `hana-img-viewer-react` React）的行为契约，
> 由两实现现状反向提取（2026-08-15，v4.0.0），**非新增功能**。
>
> **变更纪律：任何一方修改下表任一行为前，必须先在本文更新条目（描述/断言），再双端同发实现。**
> 组件测试按 `behavior/<id>` 组织命名；新行为必测两端的 component 套件。

## 用例清单

| ID | 行为 | 行为描述 | 最低断言 | Vue | React |
| --- | --- | --- | --- | --- | --- |
| B1 | 基础打开/关闭 | 关闭时仅渲染缩略图，不挂载 preview 标记；点击缩略图打开 teleport 到 body 的预览层；backdrop 点击 / Escape 关闭后卸载 preview 标记 | 关闭态 DOM 无 overlay；打开后 overlay 存在；关闭后再次无 overlay | ✅ | ✅ |
| B2 | 受控 open | `open` 受控时 viewer 保持视觉打开直到父组件更新 `open=false`；打开意图经 `update:open`/`onOpenChange` 事件回传 | 受控 `open=true` 且组件未更新时 overlay 保持挂载 | ✅ | ✅ |
| B3 | 滚轮缩放 | 滚轮/触控板滚动缩放（TrackpadDetector 区分 delta），围绕 viewport 中心锚定缩放 | 缩放 1→2 后预览位移满足 `getZoomAnchoredPosition` 契约（无 viewportCenter 时 0,0） | ✅ | ✅ |
| B4 | 双指捏合 | 触屏双指 pinch 缩放 | pinch 手势更新 scale，钳制在 [minScale, maxScale] | ✅ | ✅ |
| B5 | 拖拽平移 | 单指/鼠标拖拽平移（open 态）；FLIP 开合过渡中不注册 idle 全局监听 | 拖拽更新 translate；无关事件的全局监听 closed 时不绑定 | ✅ | ✅ |
| B6 | 双击还原 | 双击缩放至 `doubleClickScale`（默认 2），再双击还原到 1 | 双击两轮后 scale 回到 1 | ✅ | ✅ |
| B7 | FLIP 开合动画 | 打开/关闭时从缩略图位置 FLIP 到全屏几何；backdrop 以相同运动契约淡入/淡出；开合动画中保持几何稳定（含 previewSrc 升级换图时 flip shell 尺寸稳定） | animated shell 位置/尺寸与缩略图到视口几何一致 | ✅ | ✅ |
| B8 | 预览源切换（画廊） | 打开会话中 `src` 变化 → 可见预览更新为新图；`previewSrc` 就绪前保持当前增强预览可见 | src 更新后 preview src 变化 | ✅ | ✅ |
| B9 | previewSrc 静默增强 | 增强请求成功静默替换（transform 稳定）；失败在下次打开重试；请求进行中保持当前图 | 增强中预览不变；失败后下个会话重试 | ✅ | ✅ |
| B10 | 键盘快捷键 | 缩略图 Enter/Space 打开；Escape 关闭（窗口监听仅 open 态绑定；自定义 portal target 时不绑 window 监听） | 键盘触发打开/关闭；custom portal 无 window listener | ✅ | ✅ |
| B11 | 自定义 portal target | `portalTarget` 支持 body/CSS 选择器/HTMLElement/null/缺失；null 时 open 挂起等待 target 就绪；resolve 失败则发出 close 意图 | resolve 分支正确（body/selector/element/null/missing） | ✅ | ✅ |
| B12 | body 锁 | 打开会锁定 body 滚动（多个实例 refcount；scope 释放自动解锁） | 两实例开/关后 overflow 恢复 '' | ✅ | ✅ |
| B13 | SSR 无 window 分支 | SSR 默认 closed 仅渲染缩略图；`open=true` 服务端不触 client globals、不输出 overlay | 服务端渲染输出无 overlay 标记 | ✅ | ✅ |
| B14 | 样式契约 | `./style.css` 导出提取后的样式；JS 产物无运行时 CSS 注入 | dist 契约测试：style.css 存在、index.js 无 createElement('style') | ✅ | ✅ |

## 双端实现对照（物理共享面）

- 纯逻辑（缩放锚定/距离/中点/clamp、滚轮触控板检测 `createTrackpadDetector`、触摸 `getTwoTouches`/`getTouchMetrics`/`createPinchState`、portal 目标解析 `isHTMLElement`/`isBodyPortalTarget`/`resolvePortalTarget`、`getScrollbarWidth`、`resolveAspectRatio`、`loadImage`）与共享类型（Point/Transform/ViewerTransformAnchor/ViewerInteractionPhase/ViewerSourcePhase/PortalTarget/WheelState/PinchState/DEFAULT_TRANSFORM）收敛于 `packages/hana-img-viewer-core`（`packages/core`），双端构建时内联进各自 dist，发布时作为双包 dependency 提供类型。
- 交互状态机（useFLIP/useDrag/usePinch/useWheel 平行实现）**尚未**共享 —— 下一里程碑（L2）目标，行为以本表为契约。

## 测试组织策略

- 双端 component 套件按上表条目组织：Vue `tests/component/*.component.test.ts`、React `tests/component/*.component.test.tsx`，用例断言以本表"最低断言"为基准的等价行为。
- 存量测试（2026-08-15 前编写）命名未全部对齐 `behavior/<id>`；**新增行为**必须以 `behavior/<id>` 命名并双端同加。
- dist 契约测试（`tests/dist-contract`）守护 B14。

## Demo 可演示性

| ID | vue-demo | react-demo |
|----| --- | --- |
| B1/B2 | Previewer（第一图 open 状态展示） | Previewer（同） |
| B3-B7 | 打开后滚轮/拖拽/双击均可演示 | 同 |
| B8/B9 | Previewer 第二图 + previewSrc 用例 | 同 |
| B10-B12 | Previewer/Dialog 内嵌 viewer | 同 |
| B13 | 不可浏览器演示；由 SSR 套件守护 | 同 |
| B14 | 由 dist-contract 测试守护 | 同 |

- demo 入口：`apps/vue-demo`（`hana-img-viewer-demo-vue`）、`apps/react-demo`（`hana-img-viewer-demo-react`），启动 `pnpm dev:vue` / `pnpm dev:react`。