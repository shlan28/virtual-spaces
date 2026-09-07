更新日期：2026-09-06 23:52:33 CST（Asia/Shanghai）

更新说明：记录峡谷模型、贴图、媒体和运行时材质来源。

# 资产来源

| 资产 | 来源与处理 |
|---|---|
| 峡谷、洞室、道路、展台、石碑、镜框 | 本项目 `scripts/build_scene.py` 使用 Blender 制作；没有下载第三方模型 |
| 岩石颜色贴图 | 内置 imagegen 生成，复制为 `public/textures/limestone-albedo.png` |
| 程序法线、粗糙度、备用颜色、天空 | `scripts/prepare-textures.py` 用固定随机种子生成，无外部纹理依赖 |
| 视频 | 用户提供的桌面 MP4，仅用于本地原型，不自动上传或发布 |
| 切片预览 | 用 ffmpeg 从同一原片八个时间点截取，复用已有云岛图集 |
| 观点与章节 | `docs/robotics-spatial/space-design.md` 和既有内容地图，展示为编辑概括 |
| 反射与辉光 | 项目依赖 Three.js 的 Reflector、EffectComposer、UnrealBloomPass 等模块 |

生成贴图原文件：`/Users/lu/.codex/generated_images/01a0752f-b78c-7542-be89-8aacf2610f39/exec-34074cae-4f72-4a7b-89de-f759170dbfe1.png`。网页使用工程内副本，不依赖此路径。

生成提示词：

> Generate one square 1024x1024 seamless tileable physically based albedo texture for a 3D limestone canyon wall. Orthographic straight-on scan of pale warm gray ivory sedimentary limestone, weathered rough granular chalk, irregular horizontal fine laminations, small natural erosion cavities and broken ledges, extremely detailed realistic geology. Cover entire frame edge to edge with rock. Soft uniform neutral diffuse lighting no cast shadows no directional light no ambient backdrop. Restrained low contrast warm gray cream palette. No orange or dark brown bands. No perspective, no objects, no text, no border. This is a material texture tile, not a landscape or illustration.

网页运行时使用世界坐标三向投影。法线与颜色分别制作，并不是摄影测量所得的严格配套 PBR 扫描数据。没有购买素材或声称拥有第三方视频的再发布许可。
