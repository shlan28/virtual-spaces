更新日期：2026-09-09 12:29:39 CST（Asia/Shanghai）

更新说明：新增统一仓库首页，说明三个空间的用途、安装运行、媒体准备与资产管理方式。

# Virtual Spaces · 访谈知识空间

把线性访谈变成可以探索的空间：沿路线发现不同展区，拨动半圆排列的独立视频切片，阅读重点观点，再回到原片验证来源。

三个场景探索同一产品方向，分别使用云岛、峡谷和天窗博物馆的空间语言。当前使用《锦供参考》王丛访谈作为真实示例，包含八个精选章节；其他访谈展位标记为待加入。尚未提供账号后台或自动导入多期视频的功能。

| 空间 | 体验 | 启动地址 | 详细说明 |
|---|---|---|---|
| 云海思想群岛 | 云海、浮岛、石拱与分散展台 | http://127.0.0.1:4173 | [云岛 README](interview-cloud-world/README.md) |
| 峡谷回声 | 暖色光路、访谈洞室、水边观点与高处展台 | http://127.0.0.1:4175 | [峡谷 README](interview-canyon-world/README.md) |
| 天窗访谈馆 | 圆形天窗、错位入口、下沉中庭与夹层展厅 | http://127.0.0.1:4177 | [天窗馆 README](interview-oculus-world/README.md) |

## 快速开始

准备 Node.js 22.12 或更高版本及 npm，使用支持 WebGL 的现代浏览器。运行现成场景不需要 Blender 或 Blender MCP：网页模型、贴图和章节预览图已经提交。

```sh
git clone https://github.com/shlan28/virtual-spaces.git
cd virtual-spaces
```

选择一个空间，在对应目录安装和启动；同时运行多个空间时分别打开终端。

```sh
# 云岛：从仓库根目录执行
cd interview-cloud-world
npm ci
npm run dev -- --port 4173 --strictPort
```

```sh
# 峡谷：从仓库根目录执行
cd interview-canyon-world
npm ci
npm run dev
```

```sh
# 天窗访谈馆：从仓库根目录执行
cd interview-oculus-world
npm ci
npm run dev
```

仓库根目录没有 package.json，也没有统一 npm workspace；各场景保留各自依赖和启动配置。

## 准备视频

原访谈约 71 分 54 秒，视频文件未提交到 Git。克隆后可以浏览场景和章节预览，但播放原片前需要准备对应视频。

将这期访谈的本地 MP4 复制到需要运行的场景：

```text
interview-cloud-world/public/media/interview.mp4
interview-canyon-world/public/media/interview.mp4
interview-oculus-world/public/media/interview.mp4
```

例如在所选场景目录执行：

```sh
cp "/absolute/path/to/interview.mp4" public/media/interview.mp4
```

已提交的章节图集可直接使用，无需重新截图。云岛和峡谷的 `scripts/prepare-media.sh` 可接受视频路径并用 FFmpeg 重建图集；仅在需要重新生成时使用，且本机需安装 FFmpeg。若更换为另一场访谈，还需要同步调整 `src/content.ts` 的内容、时间段与章节图集。

## 浏览方式

- 点击目的地或沿预设路线移动，拖动空白处环顾空间。
- 在访谈展区横向拨动独立切片，选择章节后主动播放；原生视频时间轴可访问全片。
- 点击观点或主题装置查看说明，并进入对应来源片段。
- 关闭详情会暂停视频，返回空间探索。

这是路线漫游原型，尚不包含完整自由行走物理系统、多人同步或上传后台。各场景的具体按键和视觉限制见其 README。

## 工程与资产

采用 TypeScript、Three.js 和 Vite。Blender 制作空间骨架并导出 GLB，网页负责导航、视频切片、文字、动态效果和交互。

```text
virtual-spaces/
├── README.md                   # 统一使用入口
├── index.md                    # 目录整理与 Git 迁移记录
├── .gitignore                  # 仓库通用忽略规则
├── interview-cloud-world/
├── interview-canyon-world/
└── interview-oculus-world/
    ├── src/                    # 场景与交互代码
    ├── public/models/          # 网页 GLB 与布局数据
    ├── public/textures/        # 贴图与烘焙光照
    ├── public/media/           # 已提交图集、本地补充视频
    ├── scripts/                # 建模、资产或检查脚本
    ├── assets/                 # 本地 Blender 源文件等
    └── tests/                  # 内容或导航检查
```

最后一个目录展开了各场景的大致结构，具体文件以各自目录为准。三个场景由根目录的一个 Git 仓库管理，没有子模块或嵌套活动仓库。

| 提交到 Git | 留在本地 |
|---|---|
| 源代码、制作脚本、package-lock.json | node_modules、dist、缓存和日志 |
| GLB、布局 JSON、运行贴图、章节图集 | 原片 MP4、Blender 源文件及备份 |
| README、实施方案、验收记录 | output 中的截图和检查产物、.env 本地配置 |

根目录与各场景的 `.gitignore` 共同生效。不要忽略 GLB 或所有图片，否则新克隆的场景会缺少运行资产。Blender 源文件需要从本地保管副本取得，或按各场景脚本重新生成；烘焙模型变更后应重新生成匹配的光照贴图。详细制作方式见各场景 README。

## 检查

在所选场景目录执行：

```sh
npm test
npm run build
```

峡谷和天窗馆另提供 `npm run lint`（TypeScript 检查）；天窗馆提供 `npm run check:routes`，检查导出 GLB 的路线空间。历史验收记录分别见各场景的 `validation.md`，不代表已在所有设备上验证。

Git 合并与本地恢复记录见 [index.md](index.md)。
