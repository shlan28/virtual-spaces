"""独立峡谷资产：层岩、真实洞室、步道和展台；坐标与网页共享。"""
import bpy, math, json, random, subprocess
from pathlib import Path
from mathutils import Vector, noise
ROOT=Path(__file__).resolve().parents[1]
random.seed(36)
scene=bpy.data.scenes.new('CanyonWorld')
bpy.context.window.scene=scene
scene.world=bpy.data.worlds.new('Canyon atmosphere')
scene.world.use_nodes=True
next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND').inputs['Color'].default_value=(0.68,0.73,0.8,1)
scene.unit_settings.system='METRIC'
def xyz(p): return (p[0],-p[2],p[1])
def material(name,col):
 m=bpy.data.materials.new(name);m.diffuse_color=(*col,1);m.use_nodes=True
 b=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');b.inputs['Base Color'].default_value=(*col,1);b.inputs['Roughness'].default_value=.86
 return m
stone=material('Limestone',(0.66,.61,.54));pathmat=material('Walkway',(.66,.58,.48));brass=material('Bronze',(.32,.20,.10))
def n3(x,y,z): return noise.noise_vector(Vector((x,y,z)))[0]
def mesh(name,verts,faces,mat=stone):
 me=bpy.data.meshes.new(name);me.from_pydata([xyz(v) for v in verts],[],faces);me.update();ob=bpy.data.objects.new(name,me);scene.collection.objects.link(ob);ob.data.materials.append(mat)
 for f in me.polygons:f.use_smooth=True
 return ob
# 连续层岩体积，宽尺度体块和细层理分开计算，避免简单圆柱外观。
def cliff(name,cx,cz,rx,rz,h,seed=1):
 verts=[];faces=[];N=100;K=90
 for k in range(K+1):
  t=k/K;y=-2+t*(h+2)
  shelf=.14*math.sin(y*1.1+seed)+.055*math.sin(y*3.7+seed)+.035*math.sin(y*12.3)
  for j in range(N):
   a=j/N*math.tau;ca=math.cos(a);sa=math.sin(a)
   xx=math.copysign(abs(ca)**.63,ca);zz=math.copysign(abs(sa)**.63,sa)
   taper=1-.14*t+.10*math.sin(t*4+seed)
   x=cx+rx*xx*taper;z=cz+rz*zz*taper
   dis=.7*n3(x*.16,y*.12,z*.16)+.36*n3(x*.65,y*.8,z*.65)+.13*n3(x*2,y*2,z*2)+shelf
   x+=ca*dis;z+=sa*dis
   yy=y+.20*n3(x*.8,y*.5,z*.8)+ (max(0,t-.9)*10)*n3(x*.22,seed,z*.22)*1.8
   verts.append((x,yy,z))
 for k in range(K):
  for j in range(N):
   a=k*N+j;b=k*N+(j+1)%N;faces.append((a,b,b+N,a+N))
 faces.append(tuple(range(K*N,(K+1)*N)));faces.append(tuple(reversed(range(N))))
 return mesh(name,verts,faces)
cliff('Entry left shoulder',-9,25,14,8,17,17)
cliff('East elbow',20,-27,12,9,22,9)
cliff('West canyon wall',-29,-17,8,36,29,2)
cliff('East foreground',27,15,8,19,23,6)
cliff('East canyon wall',27,-16,9,23,26,3)
cliff('West bend buttress',-16,-34,10,14,22,8)
cliff('East upper gallery',23,-51,10,17,22,11)
cliff('Gallery foundation',7,-53,8.5,6.5,7.4,14)
cliff('Upper path buttress',12,-43,4.3,5,3.8,12)
cliff('Distant termination',-1,-83,30,12,27,13)
# 洞室以连续拱顶内表面连接前脸与后墙，是真正可以进入的体积。
cx=-13;front=8;back=-6;width=10
verts=[];faces=[];NX=100;NY=75
for j in range(NY+1):
 t=j/NY
 for i in range(NX+1):
  u=-1+2*i/NX;x=cx+u*width
  roof=1.3+7.3*math.sqrt(max(0,1-u*u))
  y=roof+(24-roof)*t
  z=front+.22*math.sin(y*1.2)+.12*math.sin(y*4.7)+.45*n3(x*.25,y*.22,2)+.1*n3(x*2,y,3)
  verts.append((x,y,z))
for j in range(NY):
 for i in range(NX):
  a=j*(NX+1)+i;faces.append((a,a+1,a+NX+2,a+NX+1))
mesh('Cave front layered facade',verts,faces)
verts=[];faces=[];NZ=48
for j in range(NZ+1):
 z=front+(back-front)*j/NZ
 for i in range(NX+1):
  a=math.pi*i/NX;x=cx+width*math.cos(a);y=1.3+7.3*math.sin(a)
  rough=.15*n3(x*.7,y*.7,z*.7)
  verts.append((x+rough,y+rough,z))
for j in range(NZ):
 for i in range(NX):
  a=j*(NX+1)+i;faces.append((a,a+NX+1,a+NX+2,a+1))
mesh('Cave vaulted interior',verts,faces)
mesh('Cave right cheek',[(-3,1.3,8),(-3,24,8),(-3,24,-6),(-3,1.3,-6)],[(0,1,2,3)])
mesh('Cave crown',[(-23,24,8),(-3,24,8),(-3,24,-6),(-23,24,-6)],[(0,1,2,3)])
cliff('Cave back wall',cx,-9,11,3,24,2)
# 平台使用足够密的顶面，边缘只做细小侵蚀。
def platform(name,cx,cz,rx,rz,y):
 vs=[];fs=[];N=100
 for yy in [y-.6,y]:
  for i in range(N):
   a=i/N*math.tau;vs.append((cx+rx*math.cos(a),yy,cz+rz*math.sin(a)))
 fs.append(tuple(range(N,N*2)))
 for i in range(N):fs.append((i,(i+1)%N,(i+1)%N+N,i+N))
 return mesh(name,vs,fs,pathmat)
platform('Interview stone dais',cx,3,9.2,5.6,1.25)
platform('Upper gallery platform',7,-53,9,7,8)
# 曲路采样使用 Catmull-Rom，与前端路径数据一致。
route=[[12,1.05,45],[12,1.05,32],[12,1.05,23],[8,1.05,12],[13,1.05,3],[11,1.05,-6],[1,1.05,-12],[-2,1.05,-23],[6,2,-33],[12,5,-43],[7,8,-53]]
def catmull(points,steps=20):
 out=[]
 for i in range(len(points)-1):
  p0=Vector(points[max(0,i-1)]);p1=Vector(points[i]);p2=Vector(points[i+1]);p3=Vector(points[min(i+2,len(points)-1)])
  for k in range(steps):
   t=k/steps;out.append(.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t))
 out.append(Vector(points[-1]));return out
def walkway(name,points,width):
 ps=catmull(points);vs=[];fs=[]
 for i,p in enumerate(ps):
  d=ps[min(len(ps)-1,i+1)]-ps[max(0,i-1)];v=Vector((-d.z,0,d.x)).normalized()*width*.5
  for h in [0,-.6]:
   for side in [-1,1]:vs.append(tuple(p+v*side+Vector((0,h,0))))
 for i in range(len(ps)-1):
  a=i*4;b=a+4;fs.extend([(a,b,b+1,a+1),(a+2,b+2,b,a),(a+1,b+1,b+3,a+3)])
 return mesh(name,vs,fs,pathmat)
walkway('Main winding walkway',route,3.8)
walkway('Cave approach',[[5,1.06,15],[0,1.06,12],[-6,1.25,11],[-13,1.25,7]],3.7)
walkway('Ideas approach',[[9,1.05,-8],[15,1.05,-9],[18,1.05,-12]],3)
# 干燥岸边位于低于步道、略高于水面的位置，不覆盖河道。
platform('West bank',-17,15,16,19,.1)
platform('East bank',27,-7,12,43,.1)
# 碎石只在岸边，离路线至少三米，避免用户行走时穿过石头。
for i in range(75):
 x=random.choice([-1,1])*random.uniform(18,26);z=random.uniform(-55,31)
 r=random.uniform(.15,.65)
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=r,location=xyz((x,.18,z)))
 o=bpy.context.object;o.name='Bank debris';o.scale=(1.5,1,.65);o.data.materials.append(stone)
# 镜框真实网格，反射平面由网页创建。
def box(name,p,scale,mat=stone):
 bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(p));o=bpy.context.object;o.name=name;o.scale=(scale[0],scale[2],scale[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat)
 bevel=o.modifiers.new('Softened edges','BEVEL');bevel.width=.055;bevel.segments=3
 return o
for x in [-6.1,-.9]:box('Mirror bronze upright',(x,6.3,-17),(.08,10.5,.15),brass)
for y in [1.05,11.55]:box('Mirror bronze lintel',(-3.5,y,-17),(5.3,.08,.15),brass)
for i in range(2):
 o=box('Comparison stone '+str(i),(14+i*2.7,2.5,3),(2.1,4.5,.7))
# 美术文件包含相机与灯光，网页另外创建可调灯光与动态展品。
bpy.ops.object.camera_add(location=xyz((14,5.6,28)));cam=bpy.context.object;cam.name='First bend composition';cam.rotation_euler=(Vector(xyz((-4,6,0)))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=27;scene.camera=cam
bpy.ops.object.light_add(type='SUN',location=xyz((-20,40,-40)));sun=bpy.context.object;sun.rotation_euler=(.45,-.5,-.6);sun.data.energy=2;sun.data.angle=.2
scene.render.engine='CYCLES';scene.cycles.samples=16;scene.render.resolution_x=1440;scene.render.resolution_y=900;scene.render.resolution_percentage=100
layout={'route':route,'platforms':{'interview':[-13,1.28,6],'summit':[7,8,-53]},'mirror':[-3.5,6.3,-16.88]}
(ROOT/'public/models/world-layout.json').write_text(json.dumps(layout,indent=2))
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/canyon-world.glb'),use_active_scene=True,export_apply=True,export_animations=False,export_cameras=False,export_lights=False)
# 库写出只包含新场景，后台再转成有正确活动场景的标准 blend。
bpy.data.libraries.write(str(ROOT/'assets/canyon-world.blend'),{scene},fake_user=True)
subprocess.run([bpy.app.binary_path,'--background',str(ROOT/'assets/canyon-world.blend'),'--python-expr',"import bpy; bpy.context.window.scene=next(s for s in bpy.data.scenes if s.name.startswith('CanyonWorld')); bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)"],check=True,capture_output=True)
result={'scene':scene.name,'objects':len(scene.objects),'vertices':sum(len(o.data.vertices) for o in scene.objects if o.type=='MESH'),'root':str(ROOT)}
print(result)
