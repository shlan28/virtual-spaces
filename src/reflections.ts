import * as THREE from 'three';
import {Reflector} from 'three/addons/objects/Reflector.js';
import type {WorldLayout} from './layout';

/** 每次只让一个反射相机更新，禁用镜面之间的递归反射。 */
export function createReflections(scene: THREE.Scene, layout: WorldLayout) {
 const water=new Reflector(new THREE.PlaneGeometry(500,500),{color:0xa9b9bb,textureWidth:768,textureHeight:768,multisample:0,clipBias:.003});
 water.rotation.x=-Math.PI/2;water.position.set(0,-.06,-22);scene.add(water);
 const mirror=new Reflector(new THREE.PlaneGeometry(5.15,10.4),{color:0xddd4ca,textureWidth:512,textureHeight:1024,multisample:0,clipBias:.003});
 mirror.position.fromArray(layout.mirror);scene.add(mirror);
 const reflectors=[water,mirror];let inside=false,low=false,tick=0;
 for(const reflector of reflectors){
  const original=reflector.onBeforeRender.bind(reflector);
  reflector.onBeforeRender=(renderer,scene,camera,geometry,material,group)=>{
   if(inside||low&&tick%3!==0)return;
   inside=true;
   const other=reflector===water?mirror:water;const visible=other.visible;other.visible=false;
   try{original(renderer,scene,camera,geometry,material,group);}finally{other.visible=visible;inside=false;}
  };
 }
 const material=water.material as THREE.ShaderMaterial;
 material.uniforms.time={value:0};
 material.fragmentShader=material.fragmentShader.replace('uniform vec3 color;', 'uniform vec3 color; uniform float time;');
 material.fragmentShader=material.fragmentShader.replace('vec4 base = texture2DProj( tDiffuse, vUv );',`vec4 rippleUv=vUv;
 rippleUv.x += (sin(vUv.y*42.+time*.35)+sin(vUv.x*31.+time*.27))*.00035*vUv.w;
 vec4 base = texture2DProj( tDiffuse, rippleUv );`);
 return {update(time:number){tick++;material.uniforms.time.value=time;},setLowQuality(value:boolean){low=value;},dispose(){reflectors.forEach(r=>{r.dispose();r.geometry.dispose();});}};
}
