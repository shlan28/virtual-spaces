import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import type {WorldLayout,Point3} from './layout';

interface Destination {name:string;description:string;position:Point3;target:Point3}
export const destinations:Record<string,Destination>={
 entry:{name:'沿着光，走进对话',description:'锦供参考 · 一座藏在峡谷里的访谈博物馆',position:[12,3.6,42],target:[10,4,26]},
 bend:{name:'转角，是另一种看见',description:'左侧洞室里，一场关于机器人与创业的对话正在等待。',position:[16,5.7,24],target:[-2,5,-1]},
 interview:{name:'机器人时代，与创业者',description:'Vol.06 · 王丛 / 地瓜机器人 CEO',position:[-13,4.7,12.5],target:[-13,3.6,2]},
 ideas:{name:'今天的订单，未来的需求',description:'读一段重点，再回到它的原始语境。',position:[12.5,3.8,12],target:[15.4,3,3]},
 mirror:{name:'在回声中，继续向前',description:'绕过镜面，光路通向峡谷更深处。',position:[6,4.8,-5],target:[-3,5,-20]},
 summit:{name:'留给下一场对话',description:'新的嘉宾与问题，将在这片高处继续生长。',position:[7,11.2,-43],target:[7,10,-55]},
 overview:{name:'一座持续生长的内容峡谷',description:'洞室承载访谈，沿途的观点连接不同问题。',position:[48,55,62],target:[-1,4,-17]}
};
export function createNavigation(camera:THREE.PerspectiveCamera,canvas:HTMLCanvasElement,layout:WorldLayout,onLocation:(id:string)=>void){
 const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.enablePan=false;controls.rotateSpeed=.32;controls.minDistance=3;controls.maxDistance=30;controls.maxPolarAngle=Math.PI*.48;
 const curve=new THREE.CatmullRomCurve3(layout.route.map(p=>new THREE.Vector3(...p)),false,'catmullrom',.5);
 const veil=document.createElement('div');veil.style.cssText='position:fixed;inset:0;background:#ece2d5;opacity:0;pointer-events:none;z-index:9;transition:opacity .22s ease';document.body.append(veil);
 let currentId='entry',last=0,journey=0,blocked=false,timer:number|undefined;
 let saved:{position:THREE.Vector3;target:THREE.Vector3;id:string}|undefined;
 const keys=new Set<string>(),point=new THREE.Vector3(),target=new THREE.Vector3();
 function setPosition(p:Point3,t:Point3){camera.position.fromArray(p);controls.target.fromArray(t);controls.update();}
 setPosition(destinations.entry.position,destinations.entry.target);
 function closestJourney(){let best=Infinity;for(let i=0;i<=200;i++){curve.getPoint(i/200,point);const d=point.distanceToSquared(camera.position);if(d<best){best=d;journey=i/200;}}}
 // 跨展区定位在遮罩内切换，镜头不飞穿岩壁；连续探索仍沿真实路线移动。
 function transition(action:()=>void){window.clearTimeout(timer);blocked=true;veil.style.opacity='1';timer=window.setTimeout(()=>{action();veil.style.opacity='0';blocked=false;},230);}
 function navigate(id:string){const d=destinations[id];if(!d)return;keys.clear();transition(()=>{currentId=id;controls.maxDistance=id==='overview'?120:30;setPosition(d.position,d.target);closestJourney();onLocation(id);});}
 function down(e:KeyboardEvent){if(e.target instanceof HTMLElement&&e.target.closest('input,textarea,button,video,[role="dialog"]'))return;if(['w','s','ArrowUp','ArrowDown'].includes(e.key)){keys.add(e.key);e.preventDefault();}}
 function up(e:KeyboardEvent){keys.delete(e.key);}
 const blur=()=>keys.clear();window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
 return {controls,navigate,
 save(){saved={position:camera.position.clone(),target:controls.target.clone(),id:currentId};keys.clear();controls.enabled=false;},
 restore(){controls.enabled=true;if(saved){camera.position.copy(saved.position);controls.target.copy(saved.target);currentId=saved.id;onLocation(currentId);saved=undefined;controls.update();}},
 update(time:number){const dt=Math.min(time-last,.05);last=time;let direction=0;if(keys.has('w')||keys.has('ArrowUp'))direction++;if(keys.has('s')||keys.has('ArrowDown'))direction--;
  if(direction&&!blocked&&controls.enabled){
   if(currentId==='interview'||currentId==='overview'||currentId==='ideas'){navigate('bend');return;}
   journey=THREE.MathUtils.clamp(journey+direction*dt*.033,0,.999);curve.getPoint(journey,point);curve.getPoint(Math.min(1,journey+.03),target);point.y+=2.2;target.y+=2.0;camera.position.copy(point);controls.target.copy(target);
  }controls.update();
 },dispose(){window.clearTimeout(timer);veil.remove();controls.dispose();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);}};
}
