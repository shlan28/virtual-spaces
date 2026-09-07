import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createVegetation} from './vegetation';
import {WorldLayout,seededRandom} from './terrain';

const noiseGLSL=`
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float f=0.;f+=.5*noise3(p);p*=2.03;f+=.25*noise3(p);p*=2.01;f+=.125*noise3(p);p*=2.02;f+=.0625*noise3(p);return f;}`;

function cloudTexture(){
 const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d')!,rand=seededRandom(100);
 for(let i=0;i<70;i++){const x=65+rand()*380,y=105+rand()*65,r=22+rand()*68;const grad=ctx.createRadialGradient(x,y,0,x,y,r);grad.addColorStop(0,'rgba(255,255,255,.32)');grad.addColorStop(.45,'rgba(255,253,248,.22)');grad.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=grad;ctx.fillRect(x-r,y-r,r*2,r*2);}
 ctx.globalCompositeOperation='destination-in';const mask=ctx.createRadialGradient(256,135,40,256,135,125);mask.addColorStop(0,'white');mask.addColorStop(1,'transparent');ctx.fillStyle=mask;ctx.fillRect(0,0,512,256);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function addSurfaceDetail(m:THREE.MeshStandardMaterial,grass:boolean){
 m.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vTerrainPosition;');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvTerrainPosition = position;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vTerrainPosition;\n'+noiseGLSL);
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float detail = fbm(vTerrainPosition * ${grass?'2.4':'1.5'});
   float fine = noise3(vTerrainPosition * 35.);
   diffuseColor.rgb *= ${grass?'mix(.80,1.22,detail)':'mix(.73,1.20,detail)'};
   diffuseColor.rgb *= .94 + .12*fine;
   ${grass?'diffuseColor.rgb = mix(diffuseColor.rgb,vec3(.42,.43,.22),smoothstep(.58,.77,detail)*.25);':'diffuseColor.rgb *= .94 + .06*sin(vTerrainPosition.z*23.+detail*12.);'}
  `);
 };
 m.customProgramCacheKey=()=>grass?'meadow-detail':'limestone-detail';
}

export async function createWorld(renderer:THREE.WebGLRenderer,onProgress:(n:number,m:string)=>void){
 const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xcfe4e4,65,220);
 const camera=new THREE.PerspectiveCamera(51,innerWidth/innerHeight,.1,700);
 const hemisphere=new THREE.HemisphereLight(0xe1f3ff,0x8e957d,1.1);scene.add(hemisphere);
 const sun=new THREE.DirectionalLight(0xffefd4,2.5);sun.position.set(-30,55,25);sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-50,right:50,top:50,bottom:-50,near:1,far:130});sun.shadow.bias=-.0005;sun.shadow.normalBias=.09;sun.shadow.radius=3;scene.add(sun);
 const environment=new RoomEnvironment();const pmrem=new THREE.PMREMGenerator(renderer);const env=pmrem.fromScene(environment,.04);scene.environment=env.texture;scene.environmentIntensity=.22;environment.dispose();pmrem.dispose();
 const sky=new THREE.Mesh(new THREE.SphereGeometry(400,40,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{},vertexShader:'varying vec3 vDirection; void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 vDirection;${noiseGLSL}
 void main(){vec3 dir=normalize(vDirection);float h=max(dir.y,0.);vec3 col=mix(vec3(.84,.92,.91),vec3(.31,.60,.74),pow(h,.5));float glow=pow(max(dot(dir,normalize(vec3(-.5,.6,.25))),0.),55.);col+=vec3(.22,.17,.10)*glow;
 vec2 uv=dir.xz/(abs(dir.y)+.14);float c=fbm(vec3(uv*.8,2.));float clouds=smoothstep(.50,.7,c)*(1.-smoothstep(.1,.7,dir.y));col=mix(col,vec3(.98,.97,.93),clouds*.8);gl_FragColor=vec4(col,1.);}` }));scene.add(sky);
 const skyTexture=await new THREE.TextureLoader().loadAsync('/textures/cloud-panorama.png');skyTexture.colorSpace=THREE.SRGBColorSpace;skyTexture.mapping=THREE.EquirectangularReflectionMapping;scene.background=skyTexture;scene.backgroundRotation.y=.9;sky.visible=false;
 onProgress(.08,'正在连接云海群岛');
 const layoutRes=await fetch('/models/world-layout.json');if(!layoutRes.ok)throw new Error('空间布局文件加载失败');const layout:WorldLayout=await layoutRes.json();
 const gltf=await new GLTFLoader().loadAsync('/models/cloud-world.glb',e=>onProgress(.10+Math.min(e.loaded/(e.total||4000000),1)*.40,'正在载入石拱与步道'));
 const detailed=new Set<THREE.Material>();const occluders:THREE.Mesh[]=[];
 gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh){occluders.push(o);o.castShadow=true;o.receiveShadow=true;const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials){if(m instanceof THREE.MeshStandardMaterial&&!detailed.has(m)){detailed.add(m);if(m.name.startsWith('Meadow')){m.color.set(0x607c46);addSurfaceDetail(m,true);}if(m.name.startsWith('Limestone')){m.color.set(0x899b93);addSurfaceDetail(m,false);}}}}});scene.add(gltf.scene);
 onProgress(.62,'正在种下花草与粉色晶体');const vegetation=createVegetation(layout);scene.add(vegetation.group);
 const clouds=new THREE.Group(),texture=cloudTexture(),rand=seededRandom(772);
 for(let i=0;i<100;i++){
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color:i%3===0?0xffecdf:0xffffff,transparent:true,opacity:.6+rand()*.22,depthWrite:false,fog:true}));
  const angle=rand()*Math.PI*2,rad=30+rand()*95;sprite.position.set(Math.cos(angle)*rad,-1+rand()*3,Math.sin(angle)*rad-15);sprite.scale.set(25+rand()*30,13+rand()*17,1);clouds.add(sprite);
 }
 scene.add(clouds);
 const waterMat=new THREE.ShaderMaterial({transparent:true,uniforms:{time:{value:0}},vertexShader:'varying vec3 vPosition;void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform float time;varying vec3 vPosition;${noiseGLSL}
 void main(){vec2 p=vPosition.xy;float n=fbm(vec3(p*.22,time*.035));float wave=sin(p.x*.25+p.y*.5+n*3.+time*.3);float shimmer=pow(max(0.,wave),18.);vec3 c=mix(vec3(.28,.65,.66),vec3(.67,.85,.81),n);c+=shimmer*.035;float fade=smoothstep(80.,190.,length(p));c=mix(c,vec3(.80,.90,.89),fade);float alpha=1.-smoothstep(35.,80.,length(p));gl_FragColor=vec4(c,alpha*.52);}`});
 const water=new THREE.Mesh(new THREE.PlaneGeometry(550,550),waterMat);water.rotation.x=-Math.PI/2;water.position.y=-3.8;scene.add(water);
 const planets=new THREE.Group();for(const [x,y,z,r]of[[-85,80,-140,11],[50,63,-180,6],[-18,55,-155,4]]){const planet=new THREE.Mesh(new THREE.SphereGeometry(r,48,32),new THREE.MeshStandardMaterial({color:x>0?0xe4cfca:0xbadede,roughness:.95,transparent:true,opacity:.62}));planet.position.set(x,y,z);planets.add(planet);}scene.add(planets);
 const motesGeo=new THREE.BufferGeometry();const positions=new Float32Array(180*3);for(let i=0;i<180;i++){positions.set([(rand()-.5)*60,5+rand()*16,(rand()-.5)*65],i*3);}motesGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));const motes=new THREE.Points(motesGeo,new THREE.PointsMaterial({color:0xffefd0,size:.045,transparent:true,opacity:.65}));scene.add(motes);
 onProgress(.85,'正在摆放访谈与观点');
 return {scene,camera,layout,occluders,
  update(time:number){waterMat.uniforms.time.value=time;motes.rotation.y=time*.008;clouds.position.x=Math.sin(time*.018)*1.3;},
  setLowQuality(low:boolean){vegetation.setLowQuality(low);sun.castShadow=!low;renderer.setPixelRatio(Math.min(devicePixelRatio,low?1:1.65));},
  dispose(){const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Points||o instanceof THREE.Sprite){if('geometry'in o)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const val of Object.values(m))if(val instanceof THREE.Texture)textures.add(val);}}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());env.dispose();skyTexture.dispose();}
 };
}
