# 三个空间统一文案与移动方式

日期：2026-09-09。状态：已完成，路线约束移动方案已由[自由 WASD 移动改造](./free-wasd-movement-plan.md)取代。

## 产品目标

云岛、峡谷、天窗访谈馆统一移除页面中的“锦供参考”，并提供一致的 WASD 移动体验。

### 文案

移除导航栏、加载页、展板、访谈信息、弹窗、浏览器标题与无障碍说明中的该字样。删除后清理多余分隔符和空行；必须有标题的展板采用场景主题标题，期号保留为“Vol.06”。同步更新 README 的当前名称。原视频画面及图片中若有内嵌字样，不属于本次网页文案修改。

### 移动体验

- W/S 沿当前路线前后移动，A/D 相对路线方向左右平移；鼠标继续负责观察。
- 支持组合键斜向移动，斜向速度与直行一致；松键即停，切换窗口、打开内容面板时清空移动状态。
- 以当前所在位置开始移动，避免按键后突然跳回主路线。手动移动打断自动行走。
- 保留展区快捷定位、展品操作和天窗馆的路线导览；左右方向键继续用于切片选择，避免与 A/D 抢占同一操作。
- 三个空间的屏幕提示与无障碍提示同步显示 WASD。

建议保留可行走范围和地面高度约束，避免增加左右移动后穿墙或离开地面；不能只增加 A/D 按键监听，仍每帧把相机吸回原路线。

## 当前实现与技术方案

已优先检查索引：项目没有 `docs/index.md`，已读取根目录 `index.md`。未找到独立命名的 code spec / code standard 文件；索引引用 `achoverse-code-spec`，已读取技能及其引用规范。沿用原生 Three.js，保持明确类型、导航职责独立、向量复用与事件释放，不引入新框架。

云岛与峡谷当前使用 OrbitControls 和路线采样驱动前后移动；改为按相机水平朝向计算位移，并同步平移相机与观察目标。天窗馆将手动位移与自动路线采样分开，避免相互覆盖。复用现有地形或布局信息约束移动范围；具体边界需结合模型布局验证，不能把现有路线数据宣称为完整碰撞系统。

统一使用 `KeyboardEvent.code` 识别 WASD，处理输入控件、内容弹层、失焦及多键释放。新增纯移动计算模块，验证方向、组合键归一化和边界处理。媒体播放与关闭后的视角恢复仍需回归。

## 逐文件 Todo

- [x] `interview-cloud-world/src/interface.ts`：移除页面字样，更新操作提示。
- [x] `interview-cloud-world/src/content.ts`：清理访谈系列名称。
- [x] `interview-cloud-world/src/exhibits.ts`：清理三维展板文案。
- [x] `interview-cloud-world/src/main.ts`：更新弹窗及画布说明，协调面板期间暂停移动。
- [x] `interview-cloud-world/src/navigation.ts`：实现 WASD、清理目的地说明并保留快捷定位。
- [x] `interview-cloud-world/src/movement.ts`：封装水平位移与场景范围约束。
- [x] `interview-cloud-world/tests/movement.test.ts`：验证移动方向、速度及范围。
- [x] `interview-cloud-world/index.html`：清理标题和描述。
- [x] `interview-cloud-world/README.md`：同步名称、移动说明及边界。
- [x] `interview-canyon-world/src/interface.ts`：移除页面字样，更新操作提示。
- [x] `interview-canyon-world/src/content.ts`：清理访谈系列名称。
- [x] `interview-canyon-world/src/exhibits.ts`：清理三维展板文案。
- [x] `interview-canyon-world/src/main.ts`：更新弹窗及画布说明。
- [x] `interview-canyon-world/src/navigation.ts`：实现 WASD、清理目的地说明并保留快捷定位。
- [x] `interview-canyon-world/src/movement.ts`：封装水平位移与场景范围约束。
- [x] `interview-canyon-world/tests/movement.test.ts`：验证移动方向、速度及范围。
- [x] `interview-canyon-world/index.html`：清理标题和描述。
- [x] `interview-canyon-world/README.md`：同步名称与移动说明，移除旧路线限制描述。
- [x] `interview-oculus-world/src/interface.ts`：移除页面字样，更新操作提示。
- [x] `interview-oculus-world/src/content.ts`：清理访谈系列名称。
- [x] `interview-oculus-world/src/exhibits.ts`：清理三维展板文案。
- [x] `interview-oculus-world/src/main.ts`：更新运行时操作提示。
- [x] `interview-oculus-world/src/navigation.ts`：实现 WASD 与自动导览切换，保持视角保存恢复。
- [x] `interview-oculus-world/src/movement.ts`：封装水平位移与场景范围约束。
- [x] `interview-oculus-world/tests/movement.test.ts`：验证移动方向、速度及范围。
- [x] `interview-oculus-world/index.html`：清理浏览器标题。
- [x] `interview-oculus-world/README.md`：同步名称与移动、导览说明。
- [x] `index.md`：登记统一操作方式与本方案入口。

## 验收与提交

检查三个空间的运行文案不再含目标字样；逐一操作 WASD、斜向、松键、失焦、展区跳转、面板开关、自动导览与切片方向键。检查边缘、走廊和展板附近的移动表现。

各空间执行构建、现有测试及新增移动测试；峡谷、天窗馆执行现有 lint，云岛无 lint 脚本，使用 TypeScript 严格未使用项检查。云岛与峡谷的 test 脚本只包含内容测试，新增测试使用现有 tsx 显式运行。天窗馆额外执行路线校验。

当前峡谷和天窗馆的 package-lock.json 已有未提交改动，本次提交不混入这些已有修改。开发完成并验证后提交一个 commit。
