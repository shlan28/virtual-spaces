更新日期：2026-09-06 23:52:33 CST（Asia/Shanghai）

更新说明：交付独立峡谷访谈空间，记录启动、三维资产、交互与实际限制。

# 锦供参考 · 峡谷回声

一座可探索的访谈空间：从入口沿着暖色光路进入，转弯后发现访谈洞室、水边观点石碑、镜面转折与高处展台。当前接入王丛的一条真实访谈、八个精选时间片、四组编辑整理观点；未来展位明确标记为待加入。

## 启动与操作

```sh
npm ci
sh scripts/prepare-media.sh
npm run dev
```

默认预览：http://127.0.0.1:4175/ 。云岛版仍保留在相邻目录，使用原来的 4173 端口。

- 拖动空白处观察、滚轮缩放；W/S 或上下方向键沿主路移动。
- 底部七个目的地可以直接定位。为避免飞穿岩壁，快捷定位采用短暂淡入淡出。
- 进入洞室，横向拨动切片，或用上一片／下一片及左右方向键选择。拨动不会自动播放。
- 点击切片或“查看片段”，再点击播放。原生时间轴可以进入整条视频的任意时间；八张切片是精选入口，不覆盖全部时间。
- 点击观点石碑或岩壁信息，阅读解释并回到原始访谈。明确选择章节／来源时从该段起点进入；通过“查看片段”重新打开已看章节时恢复本次会话进度。
- 关闭详情或 Escape 暂停视频，恢复原来的观察位置。切换页面标签也会暂停。
- 精细／流畅画质切换会控制辉光、阴影、反射更新频率和像素比。

首版是路线漫游和局部观察，不具备任意地形行走或角色碰撞。洞室、观点和全景位置按 W/S 会先返回主路入口附近，再继续沿路移动。

## 三维资产

- `assets/canyon-world.blend`：约 8.4 MB 的独立可编辑 Blender 文件，保留岩壁、洞顶、步道、石碑、展台、镜框、相机和灯光。留在本地，不进入 Git。
- `public/models/canyon-world.glb`：约 4.2 MB 的网页模型。
- `public/models/world-layout.json`：路线、展位锚点和镜面坐标，与模型统一使用 Y-up。
- `scripts/build_scene.py`：可重复生成资产的 Blender 脚本。每次建立新命名场景，不删除用户已有对象；后台规范化源文件活动场景后保存。
- `scripts/prepare-textures.py`：通过 Blender Python 生成程序法线、粗糙度、备用基础色和天空纹理。
- `public/textures/limestone-albedo.png`：imagegen 生成的自然砂岩颜色贴图，约 3.1 MB。
- `public/media/interview.mp4`：用户本地视频的副本，183 MB，排除 Git。
- `public/media/chapter-atlas.jpg`：真实原片截图的章节图集。

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/build_scene.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/prepare-textures.py
```

可以通过 Blender MCP 执行同一脚本。Blender 文件以几何和基础材质为主；网页中的三向岩石材质、动态反射、光路辉光、文字、视频和交互由 Three.js 添加，所以单独打开 blend 不会看到完整网页效果。详细来源见 `assets/asset-sources.md`。

## 工程与检查

原生 TypeScript + Three.js，Vite 构建。复用了云岛版经过验证的播放和界面机制，在独立工程中适配；没有修改云岛代码。

场景、导航、反射、效果、信息装置和界面分文件维护。内容集合与展位引用保留扩展入口，首版播放界面仍绑定当前真实样本；导入另一条视频需要增加内容、图集及活动访谈切换逻辑，并非已有账号上传后台。

```sh
npm run lint
npm run build
npm test
```

`lint` 使用 TypeScript 严格类型与未使用声明检查，不是 ESLint。当前四项来源／时间数据测试、类型检查及生产构建通过。Vite 仍提示主包超过 500 KB（压缩前约 659 KB），尚未拆包。

## 视觉与范围说明

这是可运行的三维原型，已实现峡谷、洞室、光路、倒影与视频交互。自然石材细节和明亮配色已落地，但岩壁大体块、岸边接缝、洞口轮廓和整体光照仍比概念图简化，不宣称达到原图的离线渲染精度。

当前采用实时阴影与环境照明，没有独立 AO 烘焙贴图。反射避免互相递归，流畅模式降低更新频率；这会牺牲快速运动时的反射连续性。

内容来自已有 OCR 整理和真实视频，时间范围是约略章节，未宣称逐字字幕或全部发言归属精校。只有一条真实来源，不能据此验证多期观点比较的价值。

真实浏览器验证与截图见 `validation.md`、`output/screenshots/`。截图来自网页，不是生成效果图。手机 GPU、触摸设备手感和任意观察角度下的碰撞尚未全面验证。
