# 三个空间自由 WASD 移动改造

日期：2026-09-09。状态：已确认并完成实施。

## 问题与目标

当前 WASD 仍依赖预设路线：W/S 改变路线进度，A/D 只改变有限的路线横向偏移。镜头会被路线切线控制，转向后移动方向和用户看到的方向不一致，因此操作僵硬、转弯突兀，也无法真正探索场景。

改造后，路线只用于展区引导和快捷到达，不再限制手动移动。用户可以面向任意方向行走，在云岛、峡谷和天窗访谈馆内自由探索。

## 产品体验

- W 沿当前视角的水平方向前进，S 后退，A 左移，D 右移。
- 鼠标拖动继续控制观察方向；移动时相机与观察目标同步平移，不抢夺用户视角。
- 支持 WA、WD、SA、SD 组合移动，斜向速度与直行一致。
- 加速和停止采用很短的平滑过渡，消除按键造成的顿挫，同时保持及时响应。
- 只允许站在实体地面上；悬崖、云海外缘和没有地板的位置无法继续前进。
- 墙体、岩壁、展板和建筑结构阻挡移动；斜撞墙面时沿墙滑动，避免整个人突然卡死。
- 自动适应缓坡和小台阶，保持稳定视高；首版不加入跳跃、下蹲和奔跑。
- 点击可行走展区按钮仍可快速到达目标，落地后立即恢复自由移动；全景按钮保留独立的高空观察视角。
- 打开访谈、观点弹层或切换浏览器窗口时停止移动，关闭后从原位置继续。
- 左右方向键继续选择访谈切片，不与 A/D 移动冲突。

## 技术方案

已重新检查根目录 `index.md`、现有方案和 Achoverse 前端规范。项目继续使用原生 Three.js，导航模块负责输入与相机状态，独立碰撞模块负责判断候选位置，场景模块只提供可碰撞网格。

三个空间采用一致的自由移动计算：从相机朝向取得水平 forward/right 向量，合成并归一化 WASD 输入，通过速度平滑得到本帧位移。每帧先检测前方墙体，再从候选位置向下检测地板；完整位移受阻时分别尝试两个水平轴，从而实现贴墙滑动。

云岛使用实体模型射线检测桥面、石板和岛面，并用 `surfaceHeight` 作为岛面高度的补充。峡谷与天窗馆直接使用现有 GLB 实体网格检测地板和墙体。碰撞只纳入建筑、地形和固定展陈，避免视频切片等动态交互物干扰移动。

地面高度变化使用最大上台阶高度和最大下落距离约束，并平滑调整相机 Y。若候选位置下方没有有效地面则拒绝移动。相机保留固定人体视高，不引入物理引擎。

路线数据继续服务于展区快捷到达、目的地名称和天窗馆自动导览。手动 WASD 一旦触发即停止自动导览，之后不再把相机吸回路线。云岛和峡谷的全景位置属于高空观察视角，需返回可行走展区后继续地面自由移动。

## 逐文件 Todo

- [x] `interview-cloud-world/src/world.ts`：区分并暴露固定碰撞网格。
- [x] `interview-cloud-world/src/movement.ts`：实现视角相对移动、速度平滑、地面检测、墙体阻挡和贴墙滑动。
- [x] `interview-cloud-world/src/navigation.ts`：取消路线对手动移动的约束，接入自由移动与快捷到达。
- [x] `interview-cloud-world/src/main.ts`：向导航传入碰撞网格并更新画布说明。
- [x] `interview-cloud-world/src/interface.ts`：更新自由移动提示。
- [x] `interview-cloud-world/tests/movement.test.ts`：验证视角方向、斜向速度、加减速和滑墙候选计算。
- [x] `interview-cloud-world/README.md`：说明自由移动、地面和墙体边界。
- [x] `interview-canyon-world/src/world.ts`：区分并暴露固定碰撞网格。
- [x] `interview-canyon-world/src/movement.ts`：实现视角相对移动、速度平滑、地面检测、墙体阻挡和贴墙滑动。
- [x] `interview-canyon-world/src/navigation.ts`：取消路线对手动移动的约束，接入自由移动与快捷到达。
- [x] `interview-canyon-world/src/main.ts`：向导航传入碰撞网格并更新画布说明。
- [x] `interview-canyon-world/src/interface.ts`：更新自由移动提示。
- [x] `interview-canyon-world/tests/movement.test.ts`：验证视角方向、斜向速度、加减速和滑墙候选计算。
- [x] `interview-canyon-world/README.md`：说明自由移动、地面和墙体边界。
- [x] `interview-oculus-world/src/world.ts`：区分并暴露固定碰撞网格。
- [x] `interview-oculus-world/src/movement.ts`：实现视角相对移动、速度平滑、地面检测、墙体阻挡和贴墙滑动。
- [x] `interview-oculus-world/src/navigation.ts`：将手动移动从路线采样中分离，保留自动导览和快捷到达。
- [x] `interview-oculus-world/src/main.ts`：向导航传入碰撞网格并更新运行时提示。
- [x] `interview-oculus-world/src/interface.ts`：更新自由移动提示。
- [x] `interview-oculus-world/tests/movement.test.ts`：验证视角方向、斜向速度、加减速和滑墙候选计算。
- [x] `interview-oculus-world/README.md`：说明自由移动与自动导览的关系。
- [x] `index.md`：将三个空间的统一操作方式更新为自由 WASD，并登记本方案。

## 验收标准

在三个空间分别验证前后左右、斜向、转向后继续移动、快速反向、松键停止、失焦停止、坡面与台阶、墙角滑动、场景边缘、弹层开关和快捷到达。手动移动过程中相机不得自动回到路线，也不得穿墙或掉入无地面区域。

实现后执行三个空间的类型检查、构建、内容测试和移动测试；天窗馆额外执行路线校验。浏览器中实测三个空间的连续移动手感后提交一个独立 commit，不纳入当前已有的 package-lock 修改。
