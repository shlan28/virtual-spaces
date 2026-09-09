更新日期：2026-09-09 12:29:39 CST（Asia/Shanghai）

更新说明：修正合并后的 Git 归属，补充克隆后的媒体准备步骤。

# 天窗访谈馆

一个可探索的访谈账号空间。错位入口通向下沉主题中庭，西侧展厅收录王丛访谈，东侧展厅与上层档案室等待新内容。宽缓曲坡连接夹层回廊，观点装置可回到对应访谈章节。

## 启动

在本目录执行：

```sh
npm ci
npm run dev
```

预览地址：[天窗访谈馆](http://127.0.0.1:4177/)。依赖、媒体和模型保留在各自场景目录，三个场景共享上级 `virtual-spaces` Git 仓库。

原片不随 Git 下载。播放前，将对应访谈 MP4 复制到本目录的 `public/media/interview.mp4`；章节预览图和模型已经随仓库提供。统一安装与资产说明见 [仓库 README](../README.md)。

## 操作

- 底部四个目的地：快捷定位，采用短暂淡入淡出。
- 右下方带箭头的展区按钮：沿真实连接路线自动行走；可暂停。
- W/S 沿当前路线前后行进，A/D 在路线宽度内左右移动；上/下方向键及右下前进/后退按钮继续可用。
- 鼠标或触摸拖动空白处：原地环顾。
- 侧厅中拖动切片：拨动选择；左右方向键和上一片/下一片按钮提供相同操作。
- 点击选中的切片或“查看片段”：打开原片。明确播放后发声，原生进度条可访问完整 71:54 视频。
- 点击观点或主题节点：阅读编辑概括，然后进入原片来源。
- 关闭详情或 Escape：暂停视频，恢复探索位置；再次打开同一选片保留进度。

当前只有一场真实访谈，八个切片为精选段落。展位与访谈独立配置，待加入展厅不伪造嘉宾或来源。图中概念人物与伪文字未作为内容使用。

## 文件与制作

| 文件 | 用途 |
|---|---|
| `assets/oculus-world.blend` | 可编辑的独立 Blender 源场景，本地保存 |
| `public/models/oculus-world.glb` | 网页建筑模型，带真实门洞、天窗与曲坡 |
| `public/models/world-layout.json` | 米制 Y-up 路线、观察点和展位 |
| `public/textures/architecture-lightmap.png` | Blender 漫反射烘焙并降噪的静态建筑外观 |
| `public/media/interview.mp4` | 用户提供的本地原片，不提交 Git |
| `public/media/chapter-atlas.jpg` | 从真实原片截取的章节预览图集 |
| `output/screenshots/` | 真实浏览器验收截图，本地保存 |

Blender 源文件与原片因体积较大排除 Git，但保存在此独立目录。克隆代码后需要自行放入授权视频；GLB、贴图、制作脚本与章节图集随代码提交。

建筑脚本经 Blender MCP 在独立命名场景中执行。`scripts/build-scene.py` 创建网格、展开共同图集 UV、导出 GLB 和布局，并保存独立源场景。通过 MCP 调用时须将 `__file__` 设置为该脚本的完整路径。没有删除原始默认场景。

光照通过独立后台 Blender 处理，不阻塞交互窗口。macOS 本机命令：

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background assets/oculus-world.blend --python scripts/bake-lighting.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/denoise-lighting.py
```

每次改变建筑并重新展开 UV 后，都必须重新烘焙、降噪，避免旧贴图与新 UV 不匹配。烘焙使用 Cycles 64 采样与 4096 方形图集，降噪使用 Blender 合成器；本机验证版本为 Blender 5.2。不同版本的合成器接口可能需要适配。

静态建筑使用已包含材质颜色的漫反射烘焙图，不再叠加同一组直接光。动态展品单独使用 Three.js 光照。地砖细缝在网页按世界坐标绘制。此方法保留环境光与几何遮挡，同时降低实时成本；静态建筑光照不会随时间变化。

## 检查与边界

```sh
npm run lint
npm test
npm run check:routes
npm run build
```

路线检查针对当前 GLB：验证眼高、躯干、两侧空间、地面支持和头部净空，并输出 `output/route-audit.json`。它验证导出的路线，不等于完整自由漫游物理系统。首版以路线行走和局部环顾为主，不包含多人同步、账号后台、自动视频导入或人物角色控制。

代码按场景、光照、导航、内容、播放与界面分层，保持单视频状态源及退出释放。实际视觉与测试结果见 `validation.md`。
