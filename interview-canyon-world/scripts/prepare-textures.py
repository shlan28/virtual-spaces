"""用可重复的分层噪声生成自有砂岩贴图；无需外部纹理授权。由 Blender Python 执行。"""
import bpy,numpy as np
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];N=1024
rng=np.random.default_rng(73)
y,x=np.mgrid[0:N,0:N]/N
# 可平铺的多尺度插值噪声，岩层变化和砂粒频率分离。
def field(size):
 a=rng.random((size,size));fx=x*size;fy=y*size;ix=fx.astype(int);iy=fy.astype(int);u=fx-ix;v=fy-iy;u=u*u*(3-2*u);v=v*v*(3-2*v)
 return (a[iy%size,ix%size]*(1-u)+a[iy%size,(ix+1)%size]*u)*(1-v)+(a[(iy+1)%size,ix%size]*(1-u)+a[(iy+1)%size,(ix+1)%size]*u)*v
h=sum(field(s)*w for s,w in [(4,.35),(12,.24),(36,.16),(100,.11),(260,.07)])
strata=(np.sin((y*38+field(6)*.3)*np.pi*2)*.5+.5)**12
h=h-strata*.055
color=np.clip(.70+(h-.44)*.25-strata*.03,0,1)
def save(name,rgb):
 rgba=np.concatenate([rgb,np.ones((N,N,1))],axis=2).astype('float32')
 im=bpy.data.images.new(name,width=N,height=N);im.pixels.foreach_set(rgba.flatten());im.filepath_raw=str(ROOT/'public/textures'/name);im.file_format='JPEG';im.save();bpy.data.images.remove(im)
save('limestone-basecolor.jpg',np.stack([color*1.06,color*1.005,color*.94],axis=2))
rough=np.clip(.76+(h-.5)*.3,0,1);save('limestone-roughness.jpg',np.repeat(rough[:,:,None],3,axis=2))
dx=(np.roll(h,-1,1)-np.roll(h,1,1))*12;dy=(np.roll(h,-1,0)-np.roll(h,1,0))*12
normal=np.stack([-dx,-dy,np.ones_like(dx)],2);normal/=np.linalg.norm(normal,axis=2)[:,:,None];save('limestone-normal.jpg',normal*.5+.5)
# 天空仅作远景；峡谷和洞室均来自几何体。
t=np.clip((y-.50)*2,0,1)[:,:,None];bottom=np.array([.96,.79,.67]);top=np.array([.59,.70,.81]);sky=bottom*(1-t)+top*t
sky=np.broadcast_to(sky,(N,N,3)).copy();sky+=((field(12)-.5)*.025)[:,:,None];save('canyon-sky.jpg',np.clip(sky,0,1))
print('Saved four self-authored material maps')
