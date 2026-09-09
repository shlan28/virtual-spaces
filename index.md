更新日期：2026-09-09 12:29:39 CST（Asia/Shanghai）

更新说明：补充仓库首页、统一忽略规则与克隆启动说明，修正旧文档中的独立仓库描述。

# 三维空间原型

项目介绍、安装和媒体准备见 [README](./README.md)。

## 仓库说明补充 Todo

已检查仓库中的 spec / standard / AGENTS.md 文件，未发现新增规范；沿用既有工程约定。本次仅调整文档和 Git 忽略配置，不修改应用代码。

- [x] `README.md`：新增三个空间的统一介绍、启动和资源说明。
- [x] `.gitignore`：统一忽略依赖、构建产物、本地媒体和环境配置。
- [x] `interview-cloud-world/README.md`：修正 Git 与建模脚本路径说明。
- [x] `interview-oculus-world/README.md`：修正 Git 描述，补齐视频准备步骤。
- [x] `index.md`：维护入口、启动说明和本次检查记录。

| 场景 | 独立目录 | 本地端口 |
|---|---|---|
| 云岛 | [interview-cloud-world](./interview-cloud-world/) | 4173 |
| 峡谷 | [interview-canyon-world](./interview-canyon-world/) | 4175 |
| 天窗访谈馆 | [interview-oculus-world](./interview-oculus-world/) | 4177 |

首次进入相应目录先执行 `npm ci`；云岛执行 `npm run dev -- --port 4173 --strictPort`，另外两个场景执行 `npm run dev`。三个场景共享 `virtual-spaces/.git`，统一提交和管理历史；各自依赖、启动端口、源代码、模型和媒体仍分开。没有 Git 子模块或嵌套活动仓库。旧实施记录中的独立仓库描述属于迁移前状态，以本索引为准。

## 路径适配 Todo

已对照当前项目既有 achoverse-code-spec 规范及前两版实现约定。此次仅进行目录整理与必要的路径适配，不改变场景功能。

- [x] `interview-cloud-world/scripts/build_scene.py`：从脚本位置推导工程根目录，避免继续写入旧位置。

目录迁移后检查三个 Git 根目录、天窗馆预览及模型资源能否访问。

## Git 合并与恢复

三个原仓库的提交历史作为新主线的祖先完整保留，原分支保存在 `refs/archive/` 下。原 `.git` 元数据备份位于新仓库 `.git/legacy-repositories/`，仅供本地恢复，不提交。场景目录内既有忽略规则继续生效，视频、Blender 源文件与依赖不因合并而加入版本管理。

验证方式：比较各场景的导入树与原提交树一致，检查原提交为新主线祖先，确认三个目录解析到相同的 Git 根目录。

本次检查：README 与索引的本地链接均可解析；依赖、环境配置、原片和 Blender 源文件被忽略，GLB、贴图、章节图集与锁文件继续进入版本管理。仅修改文档和忽略规则，未改动应用代码，因此未重复运行场景构建或浏览器测试。
