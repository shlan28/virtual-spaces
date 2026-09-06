import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {WorldLayout,surfaceHeight} from './terrain';

export const destinations:Record<string,{name:string;description:string;position:number[];target:number[]}>= {
 entry:{name:'从一段对话，走进一个世界',description:'沿着云间小径，发现关于创业、机器人与未来的思考。',position:[1,7.3,28],target:[-1,7.5,9]},
 arch:{name:'穿过问题的石拱',description:'同一个问题，会通往不同的答案。',position:[-8,9.3,1],target:[-8,10,-10]},
 interview:{name:'一场关于机器人时代的对话',description:'锦供参考 Vol.06 · 王丛 / 地瓜机器人 CEO',position:[-24,7.4,17],target:[-24,6.5,5]},
 summit:{name:'留给下一场对话',description:'新的访谈，将在这里继续生长。',position:[21,17.2,-12],target:[18,15.1,-25]},
 overview:{name:'思想，连成群岛',description:'一个持续生长的访谈空间 · 在不同的主题之间自由探索',position:[33,24,43],target:[-1,4,-7]}
};
export function createNavigation(camera:THREE.PerspectiveCamera,canvas:HTMLCanvasElement,layout:WorldLayout,onLocation:(id:string)=>void){
 const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.06;controls.enablePan=false;controls.minDistance=3;controls.maxDistance=100;controls.maxPolarAngle=Math.PI*.48;controls.minPolarAngle=.15;controls.rotateSpeed=.4;controls.zoomSpeed=.6;
 const curve=new THREE.CatmullRomCurve3(layout.route.map(p=>new THREE.Vector3(...p as [number,number,number])));
 let journey=0,id='entry',last=0,anim:null|{from:THREE.Vector3;to:THREE.Vector3;targetFrom:THREE.Vector3;targetTo:THREE.Vector3;t:number}=null;
 const keySet=new Set<string>();let saved:{position:THREE.Vector3;target:THREE.Vector3;id:string}|null=null;
 const setPosition=(pos:number[],target:number[])=>{camera.position.fromArray(pos);controls.target.fromArray(target);controls.update();};setPosition(destinations.entry.position,destinations.entry.target);
 function navigate(next:string){const d=destinations[next];if(!d)return;id=next;anim={from:camera.position.clone(),to:new THREE.Vector3().fromArray(d.position),targetFrom:controls.target.clone(),targetTo:new THREE.Vector3().fromArray(d.target),t:0};onLocation(next);journey=next==='summit'?1:next==='arch'?.52:0;}
 const isInput=(e:KeyboardEvent)=>e.target instanceof HTMLElement&&!!e.target.closest('input,textarea,button,video,[role="dialog"]');
 function down(e:KeyboardEvent){if(isInput(e))return;if(['w','s','ArrowUp','ArrowDown'].includes(e.key)){keySet.add(e.key);e.preventDefault();}}
 function up(e:KeyboardEvent){keySet.delete(e.key);}
 const blur=()=>keySet.clear();window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
 const stop=()=>{anim=null;};controls.addEventListener('start',stop);
 return {controls,navigate,
  save(){saved={position:camera.position.clone(),target:controls.target.clone(),id};},
  restore(){if(saved){anim={from:camera.position.clone(),to:saved.position,targetFrom:controls.target.clone(),targetTo:saved.target,t:0};id=saved.id;onLocation(id);saved=null;}},
  update(time:number){const dt=Math.min(time-last,.05);last=time;
   if(anim){anim.t+=dt/2.15;const t=Math.min(anim.t,1),s=t*t*(3-2*t);camera.position.lerpVectors(anim.from,anim.to,s);camera.position.y+=Math.sin(t*Math.PI)*Math.min(7,anim.from.distanceTo(anim.to)*.15);controls.target.lerpVectors(anim.targetFrom,anim.targetTo,s);if(t===1)anim=null;}
   let movement=0;if(keySet.has('w')||keySet.has('ArrowUp'))movement++;if(keySet.has('s')||keySet.has('ArrowDown'))movement--;
   if(movement){anim=null;journey=THREE.MathUtils.clamp(journey+movement*dt*.045,0,1);const p=curve.getPoint(journey),q=curve.getPoint(Math.min(1,journey+.07));p.y=Math.max(p.y,surfaceHeight(layout,p.x,p.z)+.3)+2.0;q.y=Math.max(q.y,surfaceHeight(layout,q.x,q.z)+.3)+1.8;camera.position.lerp(p,.15);controls.target.lerp(q,.12);}
   controls.update();
  },
  dispose(){controls.dispose();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);}
 };
}
