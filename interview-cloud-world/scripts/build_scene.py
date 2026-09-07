"""Build a separate CloudWorld scene without modifying the user's existing scene.
Run inside Blender via MCP, or blender --background --python scripts/build_scene.py.
Coordinates in functions use Three.js Y-up, mapped into Blender on creation.
"""
import bpy, math, random, json, subprocess
from pathlib import Path
from mathutils import Vector
from mathutils.noise import noise_vector

# MCP 执行时设置 __file__ 为本脚本路径，与命令行运行保持一致。
ROOT = Path(__file__).resolve().parents[1]
random.seed(240906)
for folder in ['assets','public/models','output']:
    (ROOT / folder).mkdir(parents=True, exist_ok=True)
scene = bpy.data.scenes.new('CloudWorld')
bpy.context.window.scene = scene
scene.unit_settings.system = 'METRIC'
scene.render.engine = 'BLENDER_EEVEE'
scene.world = bpy.data.worlds.new('CloudWorld-Daylight')
scene.world.use_nodes = True
next(n for n in scene.world.node_tree.nodes if n.type == 'BACKGROUND').inputs['Color'].default_value = (.58,.77,.83,1)
next(n for n in scene.world.node_tree.nodes if n.type == 'BACKGROUND').inputs['Strength'].default_value = .65

def pos(x,y,z): return (x,-z,y)
def noise(x,y,z=0): return noise_vector(Vector((x,y,z)))[0]
def mat(name,color,rough=.8,metal=0):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    bs=next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED');bs.inputs['Base Color'].default_value=(*color,1)
    bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
    return m
grass=mat('Meadow',(.30,.43,.22));rock=mat('Limestone',(.54,.61,.57));stone=mat('WarmStone',(.79,.75,.63));trim=mat('Porcelain',(.83,.86,.77));gold=mat('Brass',(.65,.48,.23),.38,.5)
def mesh(name,vs,fs,materials,indices=None,colors=None):
    data=bpy.data.meshes.new(name);data.from_pydata([pos(*v) for v in vs],[],fs);data.update()
    obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj)
    for m in materials: data.materials.append(m)
    for i,p in enumerate(data.polygons): p.use_smooth=True;p.material_index=indices[i] if indices else 0
    if colors:
        attr=data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT')
        for i,c in enumerate(colors): attr.data[i].color=(*c,1)
    return obj

# Shape metadata is shared with the browser for planting and placing content.
islands=[
 {'name':'Arrival','x':0,'z':20,'y':3.2,'rx':10,'rz':12,'dome':1.5,'depth':9,'seed':1.0},
 {'name':'Main','x':0,'z':0,'y':5.3,'rx':20,'rz':18,'dome':2.0,'depth':14,'seed':4.1},
 {'name':'Summit','x':18,'z':-23,'y':12,'rx':12,'rz':14,'dome':1.3,'depth':19,'seed':2.5},
 {'name':'Conversation','x':-24,'z':7,'y':3.0,'rx':9,'rz':8,'dome':.6,'depth':10,'seed':6.1},
 {'name':'FarWest','x':-51,'z':-37,'y':3,'rx':12,'rz':15,'dome':4,'depth':13,'seed':7.3},
 {'name':'FarNorth','x':-18,'z':-67,'y':4,'rx':16,'rz':17,'dome':6,'depth':17,'seed':9.6},
 {'name':'FarEast','x':49,'z':-53,'y':5,'rx':14,'rz':18,'dome':4,'depth':18,'seed':2.1}
]
def top_height(island,x,z):
    dx=(x-island['x'])/island['rx'];dz=(z-island['z'])/island['rz'];r=math.sqrt(dx*dx+dz*dz)
    return island['y']+island['dome']*max(0,1-r*r)+.28*math.sin(x*.47)*math.cos(z*.38)+.13*math.sin(x*1.3+z*.53)
def height(x,z):
    choices=[top_height(a,x,z) for a in islands if ((x-a['x'])/a['rx'])**2+((z-a['z'])/a['rz'])**2 < 1.08**2]
    return max(choices) if choices else 0
for a in islands:
    seg=128;rings=30;vs=[];fs=[];mi=[];colors=[]
    # Concentric surface triangulated with fine undulation and irregular coast.
    vs.append((a['x'],top_height(a,a['x'],a['z']),a['z']));colors.append((1,1,1))
    for k in range(1,rings+1):
        r=k/rings
        for j in range(seg):
            t=j/seg*math.tau
            wav=1+.035*math.sin(t*7+a['seed'])+.025*math.sin(t*13-a['seed'])
            x=a['x']+math.cos(t)*a['rx']*r*wav;z=a['z']+math.sin(t)*a['rz']*r*wav
            y=top_height(a,x,z)-.25*r**8
            vs.append((x,y,z));shade=.9+.10*math.sin(x*.9+z*.2)+.08*math.cos(z*.7-x*.5)
            colors.append((shade,shade,shade*.92))
    for j in range(seg):fs.append((0,1+j,1+(j+1)%seg));mi.append(0)
    for k in range(rings-1):
        for j in range(seg):
            p=1+k*seg+j;q=1+k*seg+(j+1)%seg
            fs.extend([(p,p+seg,q),(q,p+seg,q+seg)]);mi.extend([0,0])
    prev=1+(rings-1)*seg
    # Vertical limestone strata, rounded ledges and narrowing island underside.
    for k in range(1,18):
        u=k/17;start=len(vs)
        for j in range(seg):
            t=j/seg*math.tau
            taper=1-.47*u**1.3+.045*noise(math.cos(t)*8,math.sin(t)*8,u*4)+.018*math.sin(u*13+t*9)
            wav=1+.035*math.sin(t*7+a['seed'])+.025*math.sin(t*13-a['seed'])
            taper+=.023*math.sin(t*29+a['seed'])*math.sin(u*math.pi)
            x=a['x']+math.cos(t)*a['rx']*taper*wav;z=a['z']+math.sin(t)*a['rz']*taper*wav
            y=a['y']-.25-u*a['depth']+.24*math.sin(t*8+u*3)
            vs.append((x,y,z));c=.72+.24*(1-u)+.13*math.sin(t*23)*math.sin(u*13)
            colors.append((c,c*.98,c*.92))
        for j in range(seg):
            q=(j+1)%seg;fs.extend([(prev+j,start+j,prev+q),(prev+q,start+j,start+q)]);mi.extend([1,1])
        prev=start
    obj=mesh('Island_'+a['name'],vs,fs,[grass,rock],mi,colors)
    # Ensure terrain faces point outward regardless of source winding.
    import bmesh
    bm=bmesh.new();bm.from_mesh(obj.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(obj.data);bm.free()

def cylinder(name,x,y,z,r,depth,material):
    bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=r,depth=depth,location=pos(x,y,z))
    ob=bpy.context.object;ob.name=name;ob.data.materials.append(material)
    bevel=ob.modifiers.new('Soft stone edges','BEVEL');bevel.width=.12;bevel.segments=3
    return ob
platforms={'interview':[-24,4.25,7], 'summit':[18,13.8,-23], 'ideas':[5,7.7,0]}
for key,(x,y,z) in platforms.items():
    cylinder('Platform_'+key,x,y-.45,z,5 if key!='ideas' else 3.4,.6,stone)
    cylinder('PlatformRim_'+key,x,y-.12,z,4.95 if key!='ideas' else 3.3,.14,trim)

# Organic stone arch with open passage; a rough thick elliptical half-torus.
vs=[];fs=[]
for i in range(65):
    t=i/64*math.pi
    for j in range(20):
        p=j/20*math.tau;thick=1.5+.24*math.sin(t*13+p*3)
        x=-8+(6.1+math.cos(p)*thick)*math.cos(t)
        y=6+(7.5+math.cos(p)*thick)*math.sin(t)
        z=-7+math.sin(p)*2.0+.12*math.sin(t*31)
        vs.append((x,y,z))
for i in range(64):
    for j in range(20):
        p=i*20+j;q=i*20+(j+1)%20;fs.append((p,q,q+20,p+20))
arch=mesh('Natural_Stone_Arch',vs,fs,[rock])

# Catmull-Rom path, raised gently above land; also used for camera navigation.
control=[(0,0,29),(0,0,23),(-2,0,17),(1,0,11),(2,0,6),(-2,0,1),(-8,0,-4),(-8,0,-11),(-1,0,-13),(7,0,-11),(14,0,-15),(18,0,-21),(18,0,-23)]
for i,(x,_,z) in enumerate(control):
    y=height(x,z)+.3
    if i==9:y=9
    if i==10:y=11.5
    if i>=11:y=14
    control[i]=(x,y,z)
def catmull(ps,t):
    ft=t*(len(ps)-1);i=min(len(ps)-2,int(ft));u=ft-i
    a=Vector(ps[max(i-1,0)]);b=Vector(ps[i]);c=Vector(ps[i+1]);d=Vector(ps[min(i+2,len(ps)-1)])
    return .5*((2*b)+(-a+c)*u+(2*a-5*b+4*c-d)*u*u+(-a+3*b-3*c+d)*u*u*u)
routes=[control,[(-2,height(-2,6)+.3,6),(-9,7,10),(-17,5.4,10),(-24,4.4,7)]]
for ri,route in enumerate(routes):
    n=140 if ri==0 else 48;vs=[];fs=[]
    for k in range(n):
        t=(k+.5)/n;center=catmull(route,t);prev=catmull(route,max(0,t-.001));nxt=catmull(route,min(1,t+.001))
        delta=nxt-prev;across=Vector((-delta.z,0,delta.x)).normalized()
        center.y=max(center.y,height(center.x,center.z)+.26)
        length=(catmull(route,min(1,(k+1)/n))-catmull(route,k/n)).length*.96
        forward=delta.normalized();w=1.12 if ri==0 else .85
        corners=[]
        for down in [0,-.22]:
            for u,v in [(-1,-1),(1,-1),(1,1),(-1,1)]:
                p=center+across*w*u+forward*length*.5*v;p.y+=down;corners.append(tuple(p))
        base=len(vs);vs.extend(corners)
        fs.extend([tuple(base+j for j in face) for face in [(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)]])
    mesh('Path_Stonework_'+str(ri),vs,fs,[stone])
    for side in [-1,1]:
        curve=bpy.data.curves.new('Path_inlay','CURVE');curve.dimensions='3D';curve.bevel_depth=.025;curve.bevel_resolution=2
        spline=curve.splines.new('POLY');spline.points.add(n)
        for k in range(n+1):
            t=k/n;c=catmull(route,t);d=catmull(route,min(1,t+.001))-catmull(route,max(0,t-.001));a=Vector((-d.z,0,d.x)).normalized();c.y=max(c.y,height(c.x,c.z)+.26);p=c+a*(1.10 if ri==0 else .83)*side;p.y+=.022
            spline.points[k].co=(*pos(*p),1)
        ob=bpy.data.objects.new('Path_inlay',curve);scene.collection.objects.link(ob);curve.materials.append(gold)

# A compact ring sculpture recalling layered time, to be annotated in Three.js.
for i in range(3):
    bpy.ops.mesh.primitive_torus_add(major_radius=2.0+i*.22,minor_radius=.17,major_segments=64,minor_segments=10,location=pos(5,8.8+i*.65,0))
    bpy.context.object.name='Time_Ring_'+str(i);bpy.context.object.data.materials.append(stone)

layout={'islands':islands,'route':control,'routes':routes,'platforms':platforms}
(ROOT/'public/models/world-layout.json').write_text(json.dumps(layout),encoding='utf8')

bpy.ops.object.light_add(type='SUN',location=pos(-25,50,20));sun=bpy.context.object;sun.name='CloudWorld_Sun';sun.rotation_euler=(math.radians(25),math.radians(-30),math.radians(-25));sun.data.energy=2.8;sun.data.angle=.15
bpy.ops.object.camera_add(location=pos(44,33,55));cam=bpy.context.object;cam.name='CloudWorld_Overview';direction=Vector(pos(0,4,-4))-cam.location;cam.rotation_euler=direction.to_track_quat('-Z','Y').to_euler();cam.data.lens=36;scene.camera=cam
scene.render.resolution_x=1440;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(ROOT/'output/blender-structure.png')
bpy.data.libraries.write(str(ROOT/'assets/cloud-world.blend'), {scene}, fake_user=True)
# Re-save the isolated data as a regular startup scene, with the correct active scene.
# This avoids including unrelated scenes from the user's open Blender session.
standalone_code = "import bpy; bpy.context.window.scene=bpy.data.scenes[" + repr(scene.name) + "]; bpy.ops.wm.save_as_mainfile(filepath=" + repr(str(ROOT/'assets/cloud-world.blend')) + ")"
subprocess.run([bpy.app.binary_path, '--background', str(ROOT/'assets/cloud-world.blend'), '--python-expr', standalone_code], check=True, capture_output=True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/cloud-world.glb'),export_format='GLB',use_active_scene=True,export_apply=True,export_animations=False,export_cameras=False,export_lights=False,export_vertex_color='ACTIVE')
result={'scene':scene.name,'objects':len(scene.objects),'model':str(ROOT/'public/models/cloud-world.glb'),'blend':str(ROOT/'assets/cloud-world.blend')}
