import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import type {Point3} from './layout';

export function lightPath(points:Point3[],radius=.022){
 const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],p[1]+.035,p[2])),false,'catmullrom',.5);
 return new THREE.Mesh(new THREE.TubeGeometry(curve,300,radius,6,false),new THREE.MeshBasicMaterial({color:new THREE.Color(5.5,1.8,.52),toneMapped:false}));
}
export function createEffects(renderer:THREE.WebGLRenderer,scene:THREE.Scene,camera:THREE.Camera){
 const composer=new EffectComposer(renderer);const renderPass=new RenderPass(scene,camera);
 const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.38,.7,1.1);const output=new OutputPass();
 composer.addPass(renderPass);composer.addPass(bloom);composer.addPass(output);
 return {render(){composer.render();},resize(w:number,h:number){composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(w,h);},setLowQuality(low:boolean){bloom.enabled=!low;},dispose(){composer.dispose();bloom.dispose();output.dispose();}};
}
