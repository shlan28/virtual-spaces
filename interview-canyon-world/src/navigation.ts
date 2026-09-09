import * as THREE from 'three';
import type {Point3} from './layout';
import {FreeMovement,movementAxes} from './movement';

interface Destination {name:string;description:string;position:Point3;target:Point3}
export const destinations:Record<string,Destination>={
 entry:{name:'沿着光，走进对话',description:'一座藏在峡谷里的访谈博物馆',position:[12,3.6,42],target:[10,4,26]},
 bend:{name:'转角，是另一种看见',description:'左侧洞室里，一场关于机器人与创业的对话正在等待。',position:[16,5.7,24],target:[-2,5,-1]},
 interview:{name:'机器人时代，与创业者',description:'Vol.06 · 王丛 / 地瓜机器人 CEO',position:[-13,4.7,12.5],target:[-13,3.6,2]},
 ideas:{name:'今天的订单，未来的需求',description:'读一段重点，再回到它的原始语境。',position:[12.5,3.8,12],target:[15.4,3,3]},
 mirror:{name:'在回声中，继续向前',description:'绕过镜面，光路通向峡谷更深处。',position:[6,4.8,-5],target:[-3,5,-20]},
 summit:{name:'留给下一场对话',description:'新的嘉宾与问题，将在这片高处继续生长。',position:[7,11.2,-43],target:[7,10,-55]},
 overview:{name:'一座持续生长的内容峡谷',description:'洞室承载访谈，沿途的观点连接不同问题。',position:[48,55,62],target:[-1,4,-17]}
};

export function createNavigation(camera:THREE.PerspectiveCamera,canvas:HTMLCanvasElement,colliders:THREE.Object3D[],onLocation:(id:string)=>void){
 let enabled=true,pointer=-1,lastX=0,lastY=0,yaw=0,pitch=0,currentId='entry',last=0,blocked=false,timer:number|undefined;
 let saved:{position:THREE.Vector3;yaw:number;pitch:number;id:string}|undefined;
 const keys=new Set<string>(),facing=new THREE.Vector3();
 const movement=new FreeMovement(colliders,{speed:3.8,maxStepUp:.55,maxDrop:.9});
 const controls={
  get enabled(){return enabled;},
  set enabled(value:boolean){enabled=value;if(!value){keys.clear();movement.stop();pointer=-1;}}
 };
 const veil=document.createElement('div');veil.style.cssText='position:fixed;inset:0;background:#ece2d5;opacity:0;pointer-events:none;z-index:9;transition:opacity .22s ease';document.body.append(veil);
 function setPosition(position:Point3,target:Point3){camera.position.fromArray(position);const dx=target[0]-position[0],dy=target[1]-position[1],dz=target[2]-position[2];yaw=Math.atan2(-dx,-dz);pitch=Math.asin(THREE.MathUtils.clamp(dy/(Math.hypot(dx,dy,dz)||1),-1,1));camera.rotation.set(pitch,yaw,0,'YXZ');movement.sync(camera.position);}
 setPosition(destinations.entry.position,destinations.entry.target);
 function transition(action:()=>void){window.clearTimeout(timer);blocked=true;keys.clear();movement.stop();veil.style.opacity='1';timer=window.setTimeout(()=>{action();veil.style.opacity='0';blocked=false;},230);}
 function navigate(id:string){const d=destinations[id];if(!d)return;transition(()=>{currentId=id;setPosition(d.position,d.target);onLocation(id);});}
 function down(event:KeyboardEvent){if(!enabled||event.target instanceof HTMLElement&&event.target.closest('input,textarea,button,video,[role="dialog"]'))return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown'].includes(event.code)){keys.add(event.code);event.preventDefault();}}
 function up(event:KeyboardEvent){keys.delete(event.code);}
 const blur=()=>{keys.clear();movement.stop();pointer=-1;};
 function pointerDown(event:PointerEvent){if(!enabled||event.button!==0)return;pointer=event.pointerId;lastX=event.clientX;lastY=event.clientY;}
 function pointerMove(event:PointerEvent){if(!enabled||pointer!==event.pointerId)return;yaw-=(event.clientX-lastX)*.003;pitch=THREE.MathUtils.clamp(pitch-(event.clientY-lastY)*.003,-1.05,1.05);lastX=event.clientX;lastY=event.clientY;}
 function pointerUp(event:PointerEvent){if(pointer===event.pointerId)pointer=-1;}
 canvas.addEventListener('pointerdown',pointerDown);window.addEventListener('pointermove',pointerMove);window.addEventListener('pointerup',pointerUp);window.addEventListener('pointercancel',pointerUp);
 window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
 return {controls,navigate,
 save(){movement.stop();saved={position:camera.position.clone(),yaw,pitch,id:currentId};keys.clear();controls.enabled=false;},
 restore(){controls.enabled=true;if(saved){camera.position.copy(saved.position);yaw=saved.yaw;pitch=saved.pitch;currentId=saved.id;camera.rotation.set(pitch,yaw,0,'YXZ');onLocation(currentId);saved=undefined;movement.sync(camera.position);}},
 update(time:number){const dt=Math.min(Math.max(time-last,0),.05);last=time;if(!blocked&&enabled){camera.rotation.set(pitch,yaw,0,'YXZ');camera.getWorldDirection(facing);camera.position.add(movement.update(camera.position,facing,movementAxes(keys),dt));}
 },dispose(){window.clearTimeout(timer);veil.remove();canvas.removeEventListener('pointerdown',pointerDown);window.removeEventListener('pointermove',pointerMove);window.removeEventListener('pointerup',pointerUp);window.removeEventListener('pointercancel',pointerUp);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);}};
}
