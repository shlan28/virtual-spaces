import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {loadLayout} from './layout';
import {createReflections} from './reflections';
import {lightPath} from './effects';

// 世界坐标三向投影让不规则洞顶和岩壁保持一致尺度，无 UV 拉伸。
function stoneMaterial(base:THREE.Texture,normalMap:THREE.Texture,roughness:THREE.Texture){
 const mat=new THREE.MeshStandardMaterial({color:0xf5eee7,roughness:.87,side:THREE.DoubleSide});
 mat.onBeforeCompile=s=>{
  Object.assign(s.uniforms,{stoneColor:{value:base},stoneNormal:{value:normalMap},stoneRough:{value:roughness}});
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vStoneWorld; varying vec3 vStoneNormal;');
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvStoneWorld=(modelMatrix*vec4(position,1.)).xyz;vStoneNormal=normalize(mat3(modelMatrix)*normal);');
  s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
   varying vec3 vStoneWorld;varying vec3 vStoneNormal;
   uniform sampler2D stoneColor;uniform sampler2D stoneNormal;uniform sampler2D stoneRough;
   vec3 triColor(sampler2D tex,vec3 p,vec3 weights){return texture2D(tex,p.zy).rgb*weights.x+texture2D(tex,p.xy).rgb*weights.z+texture2D(tex,p.xz).rgb*weights.y;}`);
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec3 sw=pow(abs(vStoneNormal),vec3(8.));sw/=max(dot(sw,vec3(1.)),.001);
   vec3 sp=vStoneWorld*.19;
   diffuseColor.rgb*=triColor(stoneColor,sp,sw);
   float sediment=0.;
   diffuseColor.rgb*=1.+sediment;
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   vec3 fineNormal=triColor(stoneNormal,sp,sw)*2.-1.;
   normal=normalize(normal+vec3(fineNormal.xy*.34,0.));
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>\nroughnessFactor=triColor(stoneRough,sp,sw).r;`);
 };
 mat.customProgramCacheKey=()=> 'canyon-triplanar-v1';return mat;
}
export async function createWorld(renderer:THREE.WebGLRenderer,onProgress:(n:number,m:string)=>void){
 const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xd8c9bc,55,170);
 const camera=new THREE.PerspectiveCamera(56,innerWidth/innerHeight,.1,260);
 const loader=new THREE.TextureLoader();onProgress(.08,'光落在岩壁上');
 const [base,norm,rough,sky,layout]=await Promise.all([loader.loadAsync('/textures/limestone-albedo.png'),loader.loadAsync('/textures/limestone-normal.jpg'),loader.loadAsync('/textures/limestone-roughness.jpg'),loader.loadAsync('/textures/canyon-sky.jpg'),loadLayout()]);
 base.colorSpace=THREE.SRGBColorSpace;sky.colorSpace=THREE.SRGBColorSpace;sky.mapping=THREE.EquirectangularReflectionMapping;
 for(const t of [base,norm,rough]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;}
 scene.background=sky;const pmrem=new THREE.PMREMGenerator(renderer);const env=pmrem.fromEquirectangular(sky);scene.environment=env.texture;scene.environmentIntensity=.65;pmrem.dispose();
 const hemi=new THREE.HemisphereLight(0xd8e6f6,0xb6a087,1.1);scene.add(hemi);
 const sun=new THREE.DirectionalLight(0xffe8d6,2.5);sun.position.set(-23,42,-40);sun.target.position.set(0,0,0);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-55,right:55,top:65,bottom:-65,near:1,far:140});sun.shadow.bias=-.0002;sun.shadow.normalBias=.075;scene.add(sun,sun.target);
 const gltf=await new GLTFLoader().loadAsync('/models/canyon-world.glb',e=>onProgress(.18+Math.min(1,e.loaded/(e.total||6000000))*.45,'沿着峡谷铺开小径'));
 const rock=stoneMaterial(base,norm,rough);const occluders:THREE.Mesh[]=[];
 gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;occluders.push(o);const old=o.material as THREE.MeshStandardMaterial;if(old.name.startsWith('Limestone'))o.material=rock;else if(old.name.startsWith('Walkway')){o.material=rock.clone();(o.material as THREE.MeshStandardMaterial).color.set(0xbdb1a1);(o.material as THREE.MeshStandardMaterial).onBeforeCompile=rock.onBeforeCompile;}}});scene.add(gltf.scene);
 scene.add(lightPath(layout.route));scene.add(lightPath([[4,1.07,15],[0,1.07,12],[-6,1.27,11],[-13,1.27,7]],.016));
 // 发光路径需要实际照明，少量灯同时服务相邻路段。
 for(const p of [layout.route[1],layout.route[3],layout.route[5],layout.route[7]]){const light=new THREE.PointLight(0xff9a50,17,9,1.6);light.position.set(p[0],p[1]+.30,p[2]);scene.add(light);}
 const caveLight=new THREE.PointLight(0xffba78,48,19,1.6);caveLight.position.set(-13,4.5,4);scene.add(caveLight);
 const caveFill=new THREE.PointLight(0xffd4a4,30,15,1.5);caveFill.position.set(-13,2,-1);scene.add(caveFill);
 const reflections=createReflections(scene,layout);onProgress(.85,'把对话安放在转角');
 return {scene,camera,layout,occluders,update(time:number){reflections.update(time);if(scene.fog instanceof THREE.Fog){const overview=camera.position.y>35;scene.fog.near=overview?140:55;scene.fog.far=overview?330:170;}},
 setLowQuality(low:boolean){reflections.setLowQuality(low);sun.castShadow=!low;renderer.setPixelRatio(Math.min(devicePixelRatio,low?1:1.5));},
 dispose(){reflections.dispose();const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>([base,norm,rough,sky]);scene.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const value of Object.values(m))if(value instanceof THREE.Texture)textures.add(value);}}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());env.dispose();}
 };
}
