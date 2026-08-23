# hana-img-viewer 行为规格（Behavior Spec）

本文只定义 Vue 与 React 图像预览器共同追求的、框架无关的可观察结果。公开 prop/event 名称、源码布局、effect/composable 组织与版本可独立演进。

修改共享结果前先更新对应条目和最低断言。框架专属接口或实现可以独立变更、独立发布，但必须同步更新该端测试与下表 conformance；一端完成不能自动标记另一端完成。

## 用例与 conformance

| ID | 行为 | 框架无关结果 | 最低断言 | Vue | React |
| --- | --- | --- | --- | --- | --- |
| B1 | 基础打开/关闭 | 关闭时只有 thumbnail；打开时挂载 overlay；允许的 backdrop/Escape 意图完成关闭后卸载 overlay。 | closed/open/closed 三态 DOM 可观察。 | ✅ | ✅ |
| B2 | 可见性 ownership 与反转 | 受控模式等待 owner 确认；非受控模式自行更新；opening/closing 中相反 desired visibility 到达时立即反转。 | 受控关闭等待确认；opening→closing 与 closing→opening 均有 active-animation 用例。 | ⚠️ | ✅ |
| B3 | 滚轮缩放 | 滚轮/触控板围绕事件锚点缩放并钳制边界。 | 真实 wheel 事件更新 scale/position 且不越界。 | ✅ | ✅ |
| B4 | 双指捏合 | 双指距离变化缩放；pinch 与 drag 只有一个 owner。 | 真实 touch 事件更新 scale，pinch 会终止 drag。 | ✅ | ✅ |
| B5 | 拖拽平移 | open 时 pointer drag 平移，不受当前 scale 或 zoom 边界变化限制；非交互期无残留监听/RAF。 | scale 为 1 和小于 1 时，真实 pointer 事件都更新 translate；动态 zoom 边界变化保留 translate；cleanup 后无继续写入。 | ✅ | ✅ |
| B6 | 双击还原 | 双击在 1 与允许的 2× scale 之间切换。 | 两轮双击回到 1。 | ✅ | ✅ |
| B7 | FLIP 开合动画 | thumbnail 与 preview 的不同几何间 FLIP；backdrop 同期过渡；重叠 transition 只由当前 owner 完成。 | distinct rect keyframes；反转/卸载取消旧 Animation。 | ✅ | ✅ |
| B8 | 会话中 source 替换 | `src` 更新立即回到新 base；并发 enhancement 只有最新 generation 可生效。 | base 立即变化；旧 pending completion 被忽略。 | ✅ | ✅ |
| B9 | 静默 enhancement | 可选高质量源成功后静默替换；失败保留当前源并在下一会话重试；transform 不重置。 | success/failure/retry/in-flight replacement。 | ✅ | ✅ |
| B10 | 键盘与焦点 | 默认 trigger 可由 Enter/Space 打开；焦点进入 overlay；只有收到事件的 focused overlay 处理 Escape；关闭恢复 origin focus。 | 双实例 focused Escape 只关闭一个并恢复对应 trigger。 | ✅ | ✅ |
| B11 | 自定义 mount container | container 未就绪时不挂 overlay/不隐藏 thumbnail/不锁 body；就绪后恢复；关闭 flags 为 false 时可把自定义 container 的 dismiss ownership 交给 host。 | pending→custom、body→custom→pending 与 side-effect cleanup。 | ⚠️ | ✅ |
| B12 | body lock | 只有真实挂到 body 的 overlay 持锁；多实例引用安全；host 在锁期间的新样式不被 cleanup 覆盖。 | 两实例顺序关闭与 host-write preservation。 | ✅ | ✅ |
| B13 | SSR/hydration | server 和 first hydration snapshot 都只有 thumbnail；client commit 后才解析 container/portal。 | open/closed SSR 无 overlay；StrictMode hydrate 无 mismatch/leak。 | ✅ | ✅ |
| B14 | 样式与 dist | stylesheet 单独提取，JS 无 runtime CSS 注入，公开 exports 与声明面受契约测试保护。 | dist-contract 检查 CSS、metadata、runtime/type exports。 | ✅ | ✅ |

`✅` 表示该端已有与最低断言相符的公开 seam 测试；`⚠️` 表示行为实现存在，但 conformance 证据或已知 edge case 未完成。

## 框架接口映射

- React：`open/defaultOpen/onOpenChange` 表达 ownership；`container?: HTMLElement | null` 表达 body/custom/pending；overlay 自己处理 focused Escape，可由 dismissal flags 交回 host。完整接口见 `docs/react-api.md`。
- Vue：使用 `v-model:open`、`container?: HTMLElement | null`、`enableZoom`、`minZoom` / `maxZoom`、关闭 flags 与 `thumbnail` slot；省略 container 在 hydration 后使用 body，关闭 flags 可把 custom container 的 dismiss authority 交给 host。该接口与 React 独立演进。

## Deferred / conformance notes

- Vue B2 尚缺 active closing→opening reversal 的等价证明与已知修复。
- Vue B11 已删除 selector contract；仍需补充 body/custom/null runtime transition 的公开回归证据。
- 完整 focus trap、nested dismissable-layer stack 与 `prefers-reduced-motion` 不属于当前共享结果。

## 共享实现边界

`packages/core` 只承载已被实际复用的纯逻辑，例如 clamp、缩放锚点、触摸距离/中心、trackpad 判断、scrollbar/aspect ratio 与图片 preload。框架 lifecycle reducer、gesture owner、Animation ownership、portal orchestration 与 effects/composables 不要求共享，也没有物理对称或共享状态机里程碑。

## Demo 与测试入口

- React：`packages/react/tests/component/hana-img-viewer.component.test.tsx`、SSR、dist-contract 与 `apps/react-demo`。
- Vue：`packages/vue/tests/**` 与 `apps/vue-demo`。
- B13 由 SSR/hydration 测试守护；B14 由 dist-contract 守护；浏览器 demo 只做交互冒烟。
