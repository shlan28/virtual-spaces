import * as THREE from 'three';
import {loadLayout} from './layout';
import {createWorld} from './world';
import {createExhibits} from './exhibits';
import {createVideoSlices} from './video-slices';
import {createNavigation} from './navigation';
import {createInterface} from './interface';
import {Playback} from './playback';
import {chapters,interview} from './content';
import './styles.css';

const app=document.createElement('main');app.id='app';document.body.append(app);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
renderer.domElement.setAttribute('aria-label','天窗访谈馆三维空间');app.append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.08,180);
let nav:ReturnType<typeof createNavigation>|undefined;
let slices:Awaited<ReturnType<typeof createVideoSlices>>|undefined;
let world:Awaited<ReturnType<typeof createWorld>>|undefined;
let exhibits:ReturnType<typeof createExhibits>|undefined;
let savedNavigation:ReturnType<ReturnType<typeof createNavigation>['save']>|undefined;
function freeze(){if(nav){savedNavigation=nav.save();nav.enabled=false;}modal=true;}
let modal=false,lowQuality=false,selected=2,lastOpened:number|undefined;
const playback=new Playback({onError:message=>ui.showError(message)});

function closePanel(){playback.close();ui.closePanel();if(modal){modal=false;if(nav&&savedNavigation){nav.restore(savedNavigation);nav.enabled=true;savedNavigation=undefined;}}}
function openChapter(index:number,resume=false){
 if(!chapters[index])return;
 if(!modal){freeze();}
 selected=index;slices?.select(index);lastOpened=index;
 playback.select(interview,chapters[index],resume);ui.openChapter(index);
 ui.setSliceControls(nav?.currentId==='interview',chapters[index].title);
}
function stepSlice(direction:number){selected=THREE.MathUtils.clamp(selected+direction,0,chapters.length-1);slices?.select(selected);ui.setSliceControls(true,chapters[selected].title);}
function navigate(id:string){closePanel();nav?.navigate(id);}
const ui=createInterface({
 video:playback.video,chapters,onNavigate:navigate,onChapter:index=>openChapter(index),onPlay:()=>void playback.play(),
 onClose:closePanel,onQuality:()=>{lowQuality=!lowQuality;world?.lighting.setQuality(lowQuality);},
 onSliceStep:stepSlice,onOpenSlice:()=>openChapter(selected,lastOpened===selected),
});

const pointer=new THREE.Vector2(),ray=new THREE.Raycaster();
let downX=0,downY=0,sliceDrag=false,dragStep=0,moved=false;
function pick(e:PointerEvent){
 if(!world||!exhibits||!slices)return;
 const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);
 // 将实体墙加入同一射线序列：最近命中遮挡体即停止。
 return ray.intersectObjects([...world.occluders,...exhibits.interactive,...slices.cards],true)[0]?.object;
}
renderer.domElement.addEventListener('pointerdown',e=>{
 if(modal||!nav)return;downX=e.clientX;downY=e.clientY;moved=false;dragStep=0;
 const hit=pick(e);sliceDrag=typeof hit?.userData.chapter==='number'&&nav.currentId==='interview';
 if(sliceDrag){nav.enabled=false;renderer.domElement.setPointerCapture(e.pointerId);}
},true);
renderer.domElement.addEventListener('pointermove',e=>{
 if(modal)return;
 if(e.buttons){moved ||=Math.hypot(e.clientX-downX,e.clientY-downY)>6;}
 if(sliceDrag){const next=Math.trunc((downX-e.clientX)/65);if(next!==dragStep){stepSlice(next-dragStep);dragStep=next;}return;}
 if(!e.buttons){const hit=pick(e);renderer.domElement.style.cursor=hit&&Object.keys(hit.userData).some(k=>['chapter','insight','navigate','pending'].includes(k))?'pointer':'grab';}
});
function pointerUp(e:PointerEvent){
 if(modal)return;
 if(sliceDrag&&nav)nav.enabled=true;
 sliceDrag=false;
 if(moved)return;
 const hit=pick(e);if(!hit)return;
 const action=hit.userData;
 if(typeof action.chapter==='number'){
  if(action.chapter===selected)openChapter(selected,lastOpened===selected);
  else {selected=action.chapter;slices?.select(selected);ui.setSliceControls(true,chapters[selected].title);}
 }else if(typeof action.insight==='number'){
  const insight=exhibits?.getInsight(action.insight);if(!insight)return;
  freeze();ui.showInsight(insight.title,insight.body,()=>openChapter(insight.chapter));
 }else if(typeof action.navigate==='string')navigate(action.navigate);
 else if(action.pending){freeze();ui.showPending(String(action.pending));}
}
renderer.domElement.addEventListener('pointerup',pointerUp);
renderer.domElement.addEventListener('pointercancel',()=>{sliceDrag=false;if(nav&&!modal)nav.enabled=true;});
window.addEventListener('keydown',e=>{
 if(modal||nav?.currentId!=='interview'||(e.target instanceof HTMLElement&&e.target.closest('button,input,video')))return;
 if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();stepSlice(e.key==='ArrowLeft'?-1:1);}
 if(e.key==='Enter'){e.preventDefault();openChapter(selected,lastOpened===selected);}
});
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}
window.addEventListener('resize',resize);

async function start(){
 ui.setLoading(.05,'正在展开空间结构');
 const layout=await loadLayout();
 world=await createWorld(renderer,p=>ui.setLoading(.1+p*.75,'正在载入建筑与天光'));
 exhibits=createExhibits();world.scene.add(exhibits.group);
 slices=await createVideoSlices(playback.video,layout.interviewCenter);world.scene.add(slices.group);
 nav=createNavigation(camera,renderer.domElement,layout,id=>{
  const d=layout.destinations[id];if(!d)return;ui.setLocation(d.name,d.description);ui.setActiveDestination(id);
  ui.setSliceControls(id==='interview',chapters[selected].title);
 });
 ui.setLocation(layout.destinations.entry.name,layout.destinations.entry.description);ui.setActiveDestination('entry');
 ui.setHint('拖动环顾 · W / S 沿路前后 · 点击展品');
 ui.setLoading(1);ui.finishLoading();
 let last=performance.now(),frameCount=0,elapsed=0,fps=0;
 renderer.setAnimationLoop(now=>{
  const delta=(now-last)/1000;const dt=Math.min(delta,.05);last=now;nav?.update(dt);slices?.update(dt);
  renderer.render(world!.scene,camera);elapsed+=delta;frameCount++;
  if(elapsed>=1){fps=Math.round(frameCount/elapsed);elapsed=0;frameCount=0;}
  // 只读诊断供真实浏览器验收，不作为交互捷径。
  Object.assign(diagnostics,{fps,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,location:nav?.currentId,camera:camera.position.toArray(),selected,modal,baked:world!.baked,videoTime:playback.video.currentTime,paused:playback.video.paused});
  if(frameCount===0)renderer.domElement.dataset.diagnostics=JSON.stringify(diagnostics);
 });
}
const diagnostics:Record<string,unknown>={};
Object.defineProperty(window,'museumDiagnostics',{get:()=>({...diagnostics})});
void start().catch(error=>{ui.finishLoading();ui.showError(error instanceof Error?error.message:'空间加载失败，请刷新重试。');console.error(error);});
window.addEventListener('pagehide',()=>{renderer.setAnimationLoop(null);playback.dispose();nav?.dispose();slices?.dispose();exhibits?.dispose();world?.dispose();renderer.dispose();ui.dispose();window.removeEventListener('resize',resize);},{once:true});
