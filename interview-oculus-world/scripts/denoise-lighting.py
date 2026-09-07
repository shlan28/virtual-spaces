"""对烘焙结果执行 Blender OIDN 降噪，保持实际几何投影和 UV。"""
import bpy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
path=ROOT/'public/textures/architecture-lightmap.png'
source=bpy.data.images.load(str(path),check_existing=False)
scene=bpy.data.scenes.new('Lightmap denoising');bpy.context.window.scene=scene
scene.render.engine='CYCLES';scene.cycles.samples=1
scene.render.resolution_x=source.size[0];scene.render.resolution_y=source.size[1];scene.render.resolution_percentage=100
cam=bpy.data.objects.new('Compositor camera',bpy.data.cameras.new('Compositor camera'));scene.collection.objects.link(cam);scene.camera=cam
tree=bpy.data.node_groups.new('Lightmap denoise','CompositorNodeTree');scene.compositing_node_group=tree
tree.interface.new_socket(name='Image',in_out='OUTPUT',socket_type='NodeSocketColor')
output=tree.nodes.new('NodeGroupOutput');image=tree.nodes.new('CompositorNodeImage');image.image=source
denoise=tree.nodes.new('CompositorNodeDenoise')
tree.links.new(image.outputs['Image'],denoise.inputs['Image']);tree.links.new(denoise.outputs['Image'],output.inputs['Image'])
scene.view_settings.view_transform='Standard';scene.view_settings.look='None';scene.view_settings.exposure=0;scene.view_settings.gamma=1
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(path)
bpy.ops.render.render(write_still=True)
print('OCULUS_DENOISE_COMPLETE',flush=True)
