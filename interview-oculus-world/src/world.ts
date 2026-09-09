import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createLighting} from './lighting';

/** 仅处理场景与资产，播放和导航逻辑独立。 */
export async function createWorld(renderer:THREE.WebGLRenderer,onProgress:(p:number)=>void){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#bdcbdc');
 scene.fog=new THREE.Fog('#b8c6d5',70,130);
 const lighting=createLighting(scene,renderer);
 const gltf=await new GLTFLoader().loadAsync('/models/oculus-world.glb',e=>onProgress(e.total?e.loaded/e.total*.65:.4));
 const architecture=gltf.scene;architecture.name='Oculus architecture';scene.add(architecture);
 let baked:THREE.Texture|undefined;
 try{baked=await new THREE.TextureLoader().loadAsync('/textures/architecture-lightmap.png');baked.colorSpace=THREE.SRGBColorSpace;baked.flipY=false;baked.anisotropy=8;}catch{console.info('静态光照尚未就绪，使用实时预览。');}
 const occluders:THREE.Mesh[]=[],colliders:THREE.Object3D[]=[];
 architecture.traverse(o=>{
  if(!(o instanceof THREE.Mesh))return;
  occluders.push(o);colliders.push(o);o.castShadow=true;o.receiveShadow=true;
  const old=o.material as THREE.MeshStandardMaterial;
  if(baked){
   o.material=new THREE.MeshBasicMaterial({map:baked,color:0xffffff});
   // 精细而低对比的地砖缝沿世界坐标排列，保持贴图 UV 专用于烘焙。
   if(/floor|slab|ramp|foundation/i.test(o.name)&&!/parapet/i.test(o.name)){
    const material=o.material as THREE.MeshBasicMaterial;
    material.onBeforeCompile=shader=>{
     shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 museumPosition;');
     shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nmuseumPosition=(modelMatrix*vec4(position,1.)).xyz;');
     shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 museumPosition;');
     shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec2 grid=abs(fract(museumPosition.xz/1.8-.5)-.5)/max(fwidth(museumPosition.xz/1.8),vec2(.0001));
      float seam=1.-min(min(grid.x,grid.y),1.);
      diffuseColor.rgb*=1.-seam*.11;`);
    };
   }
   old.dispose();
  }
 });
 onProgress(.85);
 return {scene,architecture,occluders,colliders,lighting,baked:!!baked,
  dispose(){baked?.dispose();lighting.dispose();architecture.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(o.material as THREE.Material).dispose();}});}};
}
