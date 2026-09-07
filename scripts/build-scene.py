"""天窗访谈馆：共享米制布局、真实孔洞及上下层建筑，独立创建场景。"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
scene = bpy.data.scenes.new('OculusMuseum')
bpy.context.window.scene = scene
bpy.context.view_layer.update()
for existing in bpy.data.objects: existing.select_set(False)
scene.unit_settings.system = 'METRIC'
scene.world = bpy.data.worlds.new('Oculus daylight')
scene.world.use_nodes = True
bg = next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND')
bg.inputs['Color'].default_value = (.67, .75, .88, 1)
bg.inputs['Strength'].default_value = .45

def xyz(p): return (p[0], -p[2], p[1])

def material(name, color, roughness=.82, metal=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    b=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value=(*color,1)
    b.inputs['Roughness'].default_value=roughness
    b.inputs['Metallic'].default_value=metal
    m.diffuse_color=(*color,1)
    return m

wall=material('Porcelain plaster',(.67,.70,.74))
floor=material('Basalt floor',(.135,.16,.195),.57)
stone=material('Pale terrazzo',(.48,.53,.59),.75)
steel=material('Satin aluminium',(.43,.48,.53),.34,.65)

def mesh(name, verts, faces, mat=wall):
    data=bpy.data.meshes.new(name);data.from_pydata([xyz(v) for v in verts],[],faces);data.update()
    ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob);ob.data.materials.append(mat)
    bpy.context.view_layer.objects.active=ob;ob.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
    ob.select_set(False)
    bevel=ob.modifiers.new('Soft precision edges','BEVEL');bevel.width=.025;bevel.segments=2
    bevel.limit_method='ANGLE';bevel.angle_limit=.3
    return ob

def box(name, x,y,z,w,h,d, mat=wall):
    v=[(x+sx*w/2,y+sy*h/2,z+sz*d/2) for sx,sy,sz in [(-1,-1,-1),(1,-1,-1),(1,-1,1),(-1,-1,1),(-1,1,-1),(1,1,-1),(1,1,1),(-1,1,1)]]
    return mesh(name,v,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],mat)

def arc(name,cx,cz,ri,ro,low,high,start=0,end=360,mat=wall):
    n=max(6,int(abs(end-start)/2));v=[];f=[]
    for i in range(n+1):
        a=math.radians(start+(end-start)*i/n)
        v.extend([(cx+r*math.cos(a),h,cz+r*math.sin(a)) for r,h in [(ri,low),(ro,low),(ro,high),(ri,high)]])
    for i in range(n):
        a=i*4;b=a+4
        for j in range(4):f.append((a+j,a+(j+1)%4,b+(j+1)%4,b+j))
    f.extend([(3,2,1,0),tuple(n*4+j for j in range(4))])
    ob=mesh(name,v,f,mat)
    for p in ob.data.polygons:
        if p.index<n*4 and p.index%4 in (1,3):p.use_smooth=True
    return ob

def disk(name,cx,cz,r,y,thick,mat=floor):
    return arc(name,cx,cz,.005,r,y-thick,y,mat=mat)

def portal_ring(name,cx,cz,r,y,height,gaps):
    # 分段墙体及门楣保留门洞真实通行净高，无透明墙贴图。
    cursor=0
    for start,end,door_h in sorted(gaps):
        if start>cursor:arc(name+' wall',cx,cz,r,r+.5,y,y+height,cursor,start)
        arc(name+' lintel',cx,cz,r,r+.5,y+door_h,y+height,start,end)
        cursor=end
    if cursor<360:arc(name+' wall',cx,cz,r,r+.5,y,y+height,cursor,360)

# 中庭：负一米低台、三圈真实台阶及周围主楼面。
disk('Court foundation',0,0,18, -1.15,.4)
disk('Sunken forum',0,0,5.3,-.9,.25,stone)
arc('Forum step lower',0,0,5.3,5.9,-1,-.6,mat=stone)
arc('Forum step middle',0,0,5.9,6.5,-1,-.3,mat=stone)
arc('Forum step upper',0,0,6.5,7.1,-1,0,mat=stone)
arc('Main floor',0,0,7.1,18,-.35,0,mat=floor)
portal_ring('Main envelope',0,0,18,0,9.6,[(68,125,4.8),(168,192,4.8),(258,282,7.8),(333,360,4.8),(0,12,4.8)])
# 顶板中央是真实圆洞；入口与侧厅拥有各自尺度的天窗。
arc('Main oculus roof',0,0,5.8,18.6,9.6,10.15)
# Roof thickness supplies the reveal; no coplanar overlapping ring.

# 西北夹层、护墙，与东侧宽坡道在北端汇合。
arc('Mezzanine slab',0,0,11.7,18,4.18,4.5,180,270,stone)
arc('Mezzanine parapet',0,0,11.7,12.05,4.5,5.6,180,265)
box('North landing',-1.5,4.345,-18.3,4.5,.32,4,stone)
box('Ramp landing seam',-.5,4.345,-15.1,2,.32,3,stone)
def ramp(name,ri,ro,base,top,start,end,rail=False):
    n=140;v=[];f=[]
    for i in range(n+1):
        t=i/n;a=math.radians(start+(end-start)*t);y=base+(top-base)*t
        if rail:lo=y;hi=y+1.08
        else:lo=y-.28;hi=y
        v.extend([(r*math.cos(a),h,r*math.sin(a)) for r,h in [(ri,lo),(ro,lo),(ro,hi),(ri,hi)]])
    for i in range(n):
        for j in range(4):f.append((i*4+j,i*4+(j+1)%4,(i+1)*4+(j+1)%4,(i+1)*4+j))
    f.extend([(3,2,1,0),tuple(n*4+j for j in range(4))])
    return mesh(name,v,f,wall if rail else floor)
ramp('Continuous east ramp',13.1,17.5,0,4.5,70,-90)
ramp('Ramp inner parapet',13.0,13.3,0,4.5,70,-90,True)

# 下层曲墙遮挡、观点凹槽以及门洞框景。
arc('Curved entrance screen',-4,9,5.6,6.15,0,5.4,165,270)
arc('Forum backdrop',0,0,10.4,10.85,0,7,200,253)
for x in [-6.5,-2.6,1.3]:
    box('Archive reveal side',x,2.4,-9.25,.14,3.9,.28)
    box('Archive recessed board',x+1.55,2.4,-9.5,2.8,3.9,.13,stone)

# 入口前厅与错位矩形门：南北不是一眼通透的直轴线。
disk('Entry floor',-7,25,10,.025,.35)
portal_ring('Entry shell',-7,25,10,0,5.7,[(63,108,4.5),(247,291,5.0)])
arc('Entry oculus roof',-7,25,3.6,10.5,5.7,6.2)
box('Entry partition',-3,2.7,22,5.5,5.4,.65)
box('Entry threshold left',-12.8,2.2,18.5,.7,4.4,5)
box('Entry threshold lintel',-10,4.7,18.5,6.4,.6,.7)

# 三个互相独立的对话展厅：西厅真实内容，东厅及北上层预留。
for name,cx,cz,y,gaps in [('Dialogue',-24,0,0,[(0,21,4.7),(339,360,4.7)]),('Future east',24,0,0,[(159,223,4.7)]),('Future north',0,-24,4.5,[(69,111,4.7)])]:
    disk(name+' floor',cx,cz,7.7,y,.3)
    portal_ring(name,cx,cz,7.7,y,5.8,gaps)
    arc(name+' oculus roof',cx,cz,3.3,8.2,y+5.8,y+6.3)
    # The roof inner face is the skylight reveal.
    disk(name+' dais',cx,cz,5.6,y+.08,.18,stone)
box('West connecting floor',-17.8,-.16,0,5.4,.32,6,floor)
box('East connecting floor',19,-.155,-4,8,.32,6,floor)

# 光线入口与可烘焙的静态环境。
sun_data=bpy.data.lights.new('Oculus sun','SUN');sun_data.energy=1.5;sun_data.angle=.075
sun=bpy.data.objects.new('Oculus sun',sun_data);scene.collection.objects.link(sun)
sun.rotation_euler=Vector((.15,.12,-1)).to_track_quat('-Z','Y').to_euler()
for cx,cz,y,r in [(0,0,10,5.2),(-7,25,6,3.2),(-24,0,6,3),(24,0,6,3),(0,-24,10.5,3)]:
    d=bpy.data.lights.new('Skylight bounce','AREA');d.energy=850 if r>4 else 400;d.shape='DISK';d.size=r*2
    o=bpy.data.objects.new('Skylight bounce',d);scene.collection.objects.link(o);o.location=xyz((cx,y-.15,cz))

camera_data=bpy.data.cameras.new('Museum entrance');camera=bpy.data.objects.new('Museum entrance',camera_data);scene.collection.objects.link(camera)
camera.location=xyz((-9,1.7,30));target=Vector(xyz((-9,2,16)));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera_data.lens=22;scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=1440;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'

# 导航沿实地通道布置；坡道由相同角度采样，避免镜头高度漂移。
ramp_points=[[15.1*math.cos(math.radians(70-160*i/40)),4.5*i/40,15.1*math.sin(math.radians(70-160*i/40))] for i in range(41)]
layout={
 'destinations':{
  'entry':{'name':'入口叠景','description':'穿过天光，走进一场对话。','position':[-9,1.7,30],'target':[-9,2,16]},
  'court':{'name':'下沉中庭','description':'在不同问题之间，发现联系。','position':[-1,2.1,10.7],'target':[0,2.8,-4]},
  'interview':{'name':'对话侧厅','description':'Vol.06 · 王丛 / 地瓜机器人 CEO','position':[-24,1.8,5.5],'target':[-24,1.7,-2]},
  'mezzanine':{'name':'夹层回廊','description':'换一个高度，继续发现。','position':[-2,6.2,-12.4],'target':[0,1.5,1]},
  'east':{'name':'下一场对话','description':'展位待加入 · 让新的问题在这里生长。','position':[24,1.8,4],'target':[24,2,-3]},
  'north':{'name':'未来档案室','description':'上层展厅 · 等待下一位来访者。','position':[-1,6.2,-23],'target':[0,6.2,-28]}},
 'paths':{
  'entry-court':[[-9,0,30],[-9,0,24],[-9,0,19],[-8.5,0,15],[-1,0,10.7]],
  'court-interview':[[-1,0,10.7],[-7,0,13.5],[-11,0,12.5],[-15,0,8],[-15,0,3],[-18,0,0],[-21,0,0],[-24,0,3],[-24,0,5.5]],
  'court-mezzanine':[[-1,0,10.7],[-3,0,11],[2,0,13],*ramp_points,[-4,4.5,-14.3],[-2,4.5,-12.4]],
  'court-east':[[-1,0,10.7],[-3,0,11],[3,0,10],[8,0,5],[10.5,0,-5],[18,0,-5],[20,0,-4],[24,0,4]],
  'mezzanine-north':[[-2,4.5,-12.4],[-7,4.5,-13],[-2,4.5,-15],[-1,4.5,-19],[-1,4.5,-23]]},
 'interviewCenter':[-24,.08,0],
 'upcoming':[[24,.08,0],[0,4.58,-24]],
 'oculi':[{'center':[0,9.6,0],'radius':5.8},{'center':[-7,5.7,25],'radius':3.6},{'center':[-24,5.8,0],'radius':3.3},{'center':[24,5.8,0],'radius':3.3},{'center':[0,10.3,-24],'radius':3.3}]}
(ROOT/'public/models/world-layout.json').write_text(json.dumps(layout,ensure_ascii=False,indent=2))
meshes=[o for o in scene.objects if o.type=='MESH']
for o in bpy.context.selected_objects:o.select_set(False)
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0]
bpy.ops.object.convert(target='MESH')
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=.003);bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/oculus-world.glb'),export_format='GLB',use_selection=True,use_active_scene=True,export_cameras=False,export_lights=False)
bpy.data.libraries.write(str(ROOT/'assets/oculus-world.blend'),{scene},fake_user=True)
result={'scene':scene.name,'objects':len(meshes),'glb':str(ROOT/'public/models/oculus-world.glb'),'source':str(ROOT/'assets/oculus-world.blend')}
