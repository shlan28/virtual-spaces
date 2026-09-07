"""在独立后台 Blender 中烘焙漫反射，保留交互窗口与原场景。"""
import bpy, time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
scene=next(s for s in bpy.data.scenes if s.name.startswith('OculusMuseum'))
bpy.context.window.scene=scene
scene.render.engine='CYCLES';scene.cycles.samples=64
scene.cycles.use_denoising=True
scene.render.bake.margin=12
scene.render.bake.use_pass_direct=True;scene.render.bake.use_pass_indirect=True;scene.render.bake.use_pass_color=True
for o in bpy.data.objects:o.select_set(False)
objects=[o for o in scene.objects if o.type=='MESH']
image=bpy.data.images.new('Architecture baked diffuse',width=4096,height=4096,alpha=False)
image.generated_color=(.15,.18,.22,1)
for mat in {m for o in objects for m in o.data.materials}:
    node=mat.node_tree.nodes.new('ShaderNodeTexImage');node.image=image;node.name='Bake target';mat.node_tree.nodes.active=node
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=objects[0]
bpy.ops.object.bake(type='DIFFUSE',use_clear=True)
image.filepath_raw=str(ROOT/'public/textures/architecture-lightmap.png');image.file_format='PNG';image.save()
# 保存为通常可直接打开的 blend，而非仅数据块库。
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/oculus-world.blend'))
print('OCULUS_BAKE_COMPLETE',len(objects),flush=True)
