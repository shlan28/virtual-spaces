import * as THREE from 'three';

/** 静态建筑使用 Blender 漫反射烘焙；动态展陈单独受光。 */
export function createLighting(scene:THREE.Scene,renderer:THREE.WebGLRenderer){
 const hemi=new THREE.HemisphereLight(0xd9e7ff,0x56606b,2.2);scene.add(hemi);
 const sun=new THREE.DirectionalLight(0xf2f5ff,2.2);sun.position.set(-8,45,-6);sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-38;sun.shadow.camera.right=38;
 sun.shadow.camera.top=40;sun.shadow.camera.bottom=-40;sun.shadow.camera.near=.5;sun.shadow.camera.far=100;
 sun.shadow.bias=-.0001;sun.shadow.normalBias=.03;scene.add(sun);
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 let reduced=false;
 return {setQuality(low:boolean){reduced=low;renderer.setPixelRatio(Math.min(devicePixelRatio,low?1:1.7));sun.castShadow=!low;},get reduced(){return reduced;},dispose(){hemi.dispose();sun.dispose();scene.remove(hemi,sun);}};
}
