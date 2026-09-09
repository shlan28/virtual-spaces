import * as THREE from 'three';
import {WorldLayout,surfaceHeight} from './terrain';
import {FreeMovement,movementAxes} from './movement';

export const destinations:Record<string,{name:string;description:string;position:number[];target:number[]}>= {
 entry:{name:'从一段对话，走进一个世界',description:'沿着云间小径，发现关于创业、机器人与未来的思考。',position:[1,7.3,28],target:[-1,7.5,9]},
 arch:{name:'穿过问题的石拱',description:'同一个问题，会通往不同的答案。',position:[-8,9.3,1],target:[-8,10,-10]},
 interview:{name:'一场关于机器人时代的对话',description:'Vol.06 · 王丛 / 地瓜机器人 CEO',position:[-24,7.4,17],target:[-24,6.5,5]},
 summit:{name:'留给下一场对话',description:'新的访谈，将在这里继续生长。',position:[21,17.2,-12],target:[18,15.1,-25]},
 overview:{name:'思想，连成群岛',description:'一个持续生长的访谈空间 · 在不同的主题之间自由探索',position:[33,24,43],target:[-1,4,-7]}
};

export function createNavigation(camera:THREE.PerspectiveCamera,canvas:HTMLCanvasElement,layout:WorldLayout,colliders:THREE.Object3D[],onLocation:(id:string)=>void){
 let enabled=true,pointer=-1,lastX=0,lastY=0,yaw=0,pitch=0,id='entry',last=0;
 let anim:null|{from:THREE.Vector3;to:THREE.Vector3;targetFrom:THREE.Vector3;targetTo:THREE.Vector3;t:number}=null;
 const keys=new Set<string>(),facing=new THREE.Vector3(),lookTarget=new THREE.Vector3();
 const movement=new FreeMovement(colliders,{speed:4.2,fallbackGroundHeight:(x,z)=>surfaceHeight(layout,x,z)});
 let saved:{position:THREE.Vector3;target:THREE.Vector3;id:string}|null=null;
 const controls={
  get enabled(){return enabled;},
  set enabled(value:boolean){enabled=value;if(!value){keys.clear();movement.stop();pointer=-1;}}
 };
 function setAngles(position:THREE.Vector3,target:THREE.Vector3){const dx=target.x-position.x,dy=target.y-position.y,dz=target.z-position.z;yaw=Math.atan2(-dx,-dz);pitch=Math.asin(THREE.MathUtils.clamp(dy/(Math.hypot(dx,dy,dz)||1),-1,1));camera.rotation.set(pitch,yaw,0,'YXZ');}
 function setPosition(position:number[],target:number[]){camera.position.fromArray(position);lookTarget.fromArray(target);setAngles(camera.position,lookTarget);movement.sync(camera.position);}
 setPosition(destinations.entry.position,destinations.entry.target);
 function navigate(next:string){const d=destinations[next];if(!d)return;id=next;keys.clear();movement.stop();lookTarget.fromArray(d.target);anim={from:camera.position.clone(),to:new THREE.Vector3().fromArray(d.position),targetFrom:camera.position.clone().add(camera.getWorldDirection(facing).multiplyScalar(10)),targetTo:lookTarget.clone(),t:0};onLocation(next);}
 const isInput=(event:KeyboardEvent)=>event.target instanceof HTMLElement&&!!event.target.closest('input,textarea,button,video,[role="dialog"]');
 function down(event:KeyboardEvent){if(!enabled||isInput(event))return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown'].includes(event.code)){keys.add(event.code);event.preventDefault();}}
 function up(event:KeyboardEvent){keys.delete(event.code);}
 const blur=()=>{keys.clear();movement.stop();pointer=-1;};
 function pointerDown(event:PointerEvent){if(!enabled||event.button!==0)return;pointer=event.pointerId;lastX=event.clientX;lastY=event.clientY;}
 function pointerMove(event:PointerEvent){if(!enabled||pointer!==event.pointerId)return;const dx=event.clientX-lastX,dy=event.clientY-lastY;yaw-=dx*.003;pitch=THREE.MathUtils.clamp(pitch-dy*.003,-1.05,1.05);lastX=event.clientX;lastY=event.clientY;anim=null;}
 function pointerUp(event:PointerEvent){if(pointer===event.pointerId)pointer=-1;}
 canvas.addEventListener('pointerdown',pointerDown);window.addEventListener('pointermove',pointerMove);window.addEventListener('pointerup',pointerUp);window.addEventListener('pointercancel',pointerUp);
 window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
 return {controls,navigate,
  save(){movement.stop();camera.getWorldDirection(facing);saved={position:camera.position.clone(),target:camera.position.clone().add(facing.multiplyScalar(10)),id};},
  restore(){if(saved){movement.stop();anim={from:camera.position.clone(),to:saved.position,targetFrom:camera.position.clone().add(camera.getWorldDirection(facing).multiplyScalar(10)),targetTo:saved.target,t:0};id=saved.id;onLocation(id);saved=null;}},
  update(time:number){const dt=Math.min(Math.max(time-last,0),.05);last=time;const axes=movementAxes(keys);
   if((axes.forward||axes.strafe)&&anim)anim=null;
   if(anim){anim.t+=dt/2.15;const t=Math.min(anim.t,1),s=t*t*(3-2*t);camera.position.lerpVectors(anim.from,anim.to,s);camera.position.y+=Math.sin(t*Math.PI)*Math.min(7,anim.from.distanceTo(anim.to)*.15);lookTarget.lerpVectors(anim.targetFrom,anim.targetTo,s);camera.lookAt(lookTarget);if(t===1){setAngles(camera.position,anim.targetTo);anim=null;movement.sync(camera.position);}}
   else if(enabled){camera.rotation.set(pitch,yaw,0,'YXZ');camera.getWorldDirection(facing);camera.position.add(movement.update(camera.position,facing,axes,dt));}
  },
  dispose(){canvas.removeEventListener('pointerdown',pointerDown);window.removeEventListener('pointermove',pointerMove);window.removeEventListener('pointerup',pointerUp);window.removeEventListener('pointercancel',pointerUp);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);}
 };
}
