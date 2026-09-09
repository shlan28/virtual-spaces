import * as THREE from 'three';
import './styles.css';
import {createWorld} from './world';
import {createEffects} from './effects';
import {createNavigation,destinations} from './navigation';
import {createVideoSlices} from './video-slices';
import {createExhibits} from './exhibits';
import {createInterface} from './interface';
import {chapters,interview} from './content';

const host=document.getElementById('scene')!;
const video=document.createElement('video');video.src=interview.src;video.preload='none';video.playsInline=true;video.controls=true;video.poster='/media/chapter-atlas.jpg';
let world:Awaited<ReturnType<typeof createWorld>>|undefined;
let navigation:ReturnType<typeof createNavigation>|undefined;
let slices:Awaited<ReturnType<typeof createVideoSlices>>|undefined;
let exhibits:ReturnType<typeof createExhibits>|undefined;
let renderer:THREE.WebGLRenderer|undefined;
let effects:ReturnType<typeof createEffects>|undefined;
const playbackPositions=new Map<string,number>();
let lowQuality=false,panelOpen=false,disposed=false,currentChapter=2;
let pendingSeek:number|undefined;
const ui=createInterface({video,chapters,
 onNavigate:id=>{closePanel();navigation?.navigate(id);},
 onSliceStep:direction=>{slices?.step(direction);if(slices)ui.setSliceControls(true,chapters[slices.current].title);},onOpenSlice:()=>{if(slices)openChapter(slices.current,true);},
 onChapter:i=>openChapter(i),onPlay:()=>{void video.play().catch(()=>ui.showError('请点击播放器中的播放按钮开始观看。'));},
 onClose:closePanel,onQuality:()=>{lowQuality=!lowQuality;world?.setLowQuality(lowQuality);effects?.setLowQuality(lowQuality);resize();}
});
function closePanel(){if(panelOpen)playbackPositions.set(interview.id+':'+currentChapter,video.currentTime);video.pause();ui.closePanel();if(panelOpen)navigation?.restore();panelOpen=false;}
function openChapter(index:number,resume=false){
 if(!chapters[index])return;
 if(panelOpen)playbackPositions.set(interview.id+':'+currentChapter,video.currentTime);
 if(!panelOpen)navigation?.save();panelOpen=true;currentChapter=index;video.pause();slices?.select(index);ui.setSliceControls(true,chapters[index].title);
 const start=(resume?playbackPositions.get(interview.id+':'+index):undefined)??chapters[index].start;
 if(video.preload==='none'){video.preload='metadata';video.load();}
 if(video.readyState>=1){video.currentTime=start;pendingSeek=undefined;}else pendingSeek=start;
 ui.openChapter(index);
}
function metadata(){if(pendingSeek!==undefined){video.currentTime=pendingSeek;pendingSeek=undefined;}}
video.addEventListener('loadedmetadata',metadata);
function mediaError(){ui.showError('本地视频暂时无法加载，请运行 npm 的媒体准备说明后刷新。空间仍可浏览。');}
video.addEventListener('error',mediaError);

const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
let pressed:{x:number;y:number;chapter?:number;dragged:boolean;steps:number}|undefined;
function pick(event:PointerEvent){if(!world||!renderer)return;const r=renderer.domElement.getBoundingClientRect();mouse.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(mouse,world.camera);const hits=raycaster.intersectObjects([...(slices?.cards||[]),...(slices?.satellites.children||[]),...(exhibits?.interactive||[]),...world.occluders],true);for(const hit of hits){if(world.occluders.includes(hit.object as THREE.Mesh))return;if(Object.keys(hit.object.userData).length>0)return hit;}return;}
function down(event:PointerEvent){const hit=pick(event);const chapter=hit?.object.userData.chapter as number|undefined;pressed={x:event.clientX,y:event.clientY,chapter,dragged:false,steps:0};if(chapter!==undefined&&navigation){navigation.controls.enabled=false;renderer?.domElement.setPointerCapture(event.pointerId);}}
function move(event:PointerEvent){
 if(pressed){const dx=event.clientX-pressed.x;if(Math.abs(dx)>8||Math.abs(event.clientY-pressed.y)>8)pressed.dragged=true;if(pressed.chapter!==undefined){const steps=Math.trunc(-dx/65);if(steps!==pressed.steps){slices?.step(steps-pressed.steps);pressed.steps=steps;if(slices)ui.setSliceControls(true,chapters[slices.current].title);}return;}}
 if(renderer)renderer.domElement.style.cursor=pick(event)?'pointer':'grab';
}
function up(event:PointerEvent){
 const state=pressed;pressed=undefined;if(navigation)navigation.controls.enabled=true;
 if(renderer?.domElement.hasPointerCapture(event.pointerId))renderer.domElement.releasePointerCapture(event.pointerId);
 if(!state||state.dragged)return;const hit=pick(event);if(!hit)return;const data=hit.object.userData;
 if(typeof data.chapter==='number')openChapter(data.chapter);
 else if(typeof data.navigate==='string'){closePanel();navigation?.navigate(data.navigate);}
 else if(typeof data.insight==='number'){const insight=exhibits?.getInsight(data.insight);if(insight){if(!panelOpen)navigation?.save();panelOpen=true;video.pause();ui.showInsight(insight.title,insight.body,()=>openChapter(insight.chapter));}}
 else if(data.pending){if(!panelOpen)navigation?.save();panelOpen=true;ui.showInsight('下一场对话，留在峡谷','目前接入的是第六期真实访谈。这里预留给未来访谈，不代表已有节目或嘉宾。',()=>{closePanel();navigation?.navigate('interview');});}
}
function cancel(){pressed=undefined;if(navigation)navigation.controls.enabled=true;}
function key(event:KeyboardEvent){
 if(event.key==='Escape'){closePanel();return;}
 if(event.target instanceof HTMLElement&&event.target.closest('input,textarea,video,button'))return;
 if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();slices?.step(event.key==='ArrowLeft'?-1:1);if(slices)ui.setSliceControls(true,chapters[slices.current].title);}
 if(event.key==='Enter'&&slices)openChapter(slices.current);
}
function resize(){if(!world||!renderer)return;world.camera.aspect=host.clientWidth/host.clientHeight;world.camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);effects?.resize(host.clientWidth,host.clientHeight);}
function visibility(){if(document.hidden)video.pause();}
let frame=0,lastTime=0,frameTimes:number[]=[],diagnosticTick=0;
async function start(){
 try{
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(host.clientWidth,host.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.info.autoReset=false;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','拖动观察，WASD 沿路线移动，左右键拨动切片，Enter 查看');host.append(renderer.domElement);
  world=await createWorld(renderer,ui.setLoading);if(disposed)return;
  effects=createEffects(renderer,world.scene,world.camera);
  navigation=createNavigation(world.camera,renderer.domElement,world.layout,id=>{const d=destinations[id];ui.setLocation(d.name,d.description);ui.setActiveDestination(id);ui.setSliceControls(id==='interview',chapters[slices?.current??2].title);});
  exhibits=createExhibits();world.scene.add(exhibits.group);
  slices=await createVideoSlices(video,world.layout.platforms.interview);world.scene.add(slices.group,slices.satellites);
  ui.setLoading(.97,'准备出发');
  await renderer.compileAsync(world.scene,world.camera);
  ui.setLocation(destinations.entry.name,destinations.entry.description);ui.finishLoading();
  renderer.domElement.addEventListener('pointerdown',down,true);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',cancel);
  window.addEventListener('keydown',key);window.addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility);
  function tick(ms:number){if(disposed||!world||!renderer)return;const t=ms*.001,dt=Math.min(t-lastTime,.05);if(lastTime)frameTimes.push(ms-lastTime*1000);if(frameTimes.length>120)frameTimes.shift();lastTime=t;navigation?.update(t);world.update(t);slices?.update(dt);exhibits?.update(world.camera,t);renderer.info.reset();effects?.render();if(++diagnosticTick%30===0){host.dataset.fps=(1000/(frameTimes.reduce((a,b)=>a+b,0)/Math.max(1,frameTimes.length))).toFixed(1);host.dataset.drawCalls=String(renderer.info.render.calls);host.dataset.triangles=String(renderer.info.render.triangles);host.dataset.selectedChapter=String(slices?.current);host.dataset.camera=world.camera.position.toArray().map(n=>n.toFixed(2)).join(',');}frame=requestAnimationFrame(tick);}
  frame=requestAnimationFrame(tick);
  // Read-only diagnostics for validation; no debug controls are shown in the product UI.
  Object.defineProperty(window,'canyonWorldDiagnostics',{configurable:true,get:()=>({fps:frameTimes.length?1000/(frameTimes.reduce((a,b)=>a+b,0)/frameTimes.length):0,drawCalls:renderer?.info.render.calls,triangles:renderer?.info.render.triangles,camera:world?.camera.position.toArray(),selectedChapter:slices?.current,currentChapter,videoTime:video.currentTime,videoPaused:video.paused,lowQuality})});
 }catch(error){console.error(error);ui.finishLoading();ui.showError(`空间暂时未能完成加载：${error instanceof Error?error.message:'请刷新重试'}`);}
}
void start();
function dispose(){disposed=true;cancelAnimationFrame(frame);video.pause();video.removeEventListener('loadedmetadata',metadata);video.removeEventListener('error',mediaError);video.removeAttribute('src');video.load();window.removeEventListener('keydown',key);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);navigation?.dispose();slices?.dispose();exhibits?.dispose();effects?.dispose();world?.dispose();ui.dispose();if(renderer){renderer.domElement.removeEventListener('pointerdown',down,true);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('pointercancel',cancel);renderer.dispose();renderer.domElement.remove();}}
if(import.meta.hot)import.meta.hot.dispose(dispose);
