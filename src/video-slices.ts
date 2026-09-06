import * as THREE from 'three';
import {chapters,formatTime} from './content';

function cardTexture(atlas:HTMLImageElement,index:number){
 const c=document.createElement('canvas');c.width=512;c.height=896;const x=c.getContext('2d')!,chapter=chapters[index];
 x.fillStyle='#eee2d2';x.fillRect(0,0,512,896);
 x.strokeStyle='#bc9f80';x.lineWidth=2;x.strokeRect(14,14,484,868);
 x.fillStyle='#8a6f54';x.font='22px sans-serif';x.fillText(`VOL.06     /     ${String(index+1).padStart(2,'0')}`,40,64);
 const sx=(index%4)*512,sy=Math.floor(index/4)*288;x.drawImage(atlas,sx,sy,512,288,24,95,464,261);
 x.fillStyle='#42372e';x.font='32px serif';
 const chars=[...chapter.title];let line='',y=420;for(const ch of chars){if(x.measureText(line+ch).width>430){x.fillText(line,40,y);line=ch;y+=48;}else line+=ch;}x.fillText(line,40,y);
 x.fillStyle='#78644f';x.font='21px sans-serif';x.fillText('王丛 · 地瓜机器人',40,600);x.fillText(`${formatTime(chapter.start)} — ${formatTime(chapter.end)}`,40,642);
 x.strokeStyle='#c4ad92';x.beginPath();x.moveTo(40,701);x.lineTo(472,701);x.stroke();
 x.fillStyle='#644b36';x.beginPath();x.arc(256,783,28,0,Math.PI*2);x.fill();x.fillStyle='#f6f1df';x.beginPath();x.moveTo(250,771);x.lineTo(250,795);x.lineTo(268,783);x.fill();
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
export async function createVideoSlices(video:HTMLVideoElement,center:number[]){
 const group=new THREE.Group();group.position.fromArray(center);group.name='Independent semicircle video chapters';
 const atlas=new Image();atlas.src='/media/chapter-atlas.jpg';await atlas.decode();
 const cards:THREE.Group[]=[],textures:THREE.Texture[]=[];
 const targetPosition=new THREE.Vector3();
 const targetScale=new THREE.Vector3();
 const radius=4.6;
 const backingMaterial=new THREE.MeshStandardMaterial({color:0xa68a68,metalness:.3,roughness:.4});
 const videoTexture=new THREE.VideoTexture(video);videoTexture.colorSpace=THREE.SRGBColorSpace;
 const videoPlane=new THREE.Mesh(new THREE.PlaneGeometry(1.50,.844),new THREE.MeshBasicMaterial({map:videoTexture,toneMapped:false}));videoPlane.position.set(0,.765,.077);videoPlane.visible=false;
 let current=2;
 for(let i=0;i<chapters.length;i++){
  const card=new THREE.Group(),texture=cardTexture(atlas,i);textures.push(texture);
  const back=new THREE.Mesh(new THREE.BoxGeometry(1.69,2.96,.09),backingMaterial);back.castShadow=true;card.add(back);
  const front=new THREE.Mesh(new THREE.PlaneGeometry(1.66,2.92),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));front.position.z=.049;front.userData.chapter=i;back.userData.chapter=i;card.add(front);
  const foot=new THREE.Mesh(new THREE.BoxGeometry(.65,.07,.55),backingMaterial);foot.position.y=-1.5;card.add(foot);cards.push(card);group.add(card);
 }
 function select(index:number){current=THREE.MathUtils.clamp(index,0,cards.length-1);cards[current].add(videoPlane);}
 select(current);
 function update(dt:number){
  const alpha=1-Math.exp(-Math.min(dt,1)*8);
  for(let i=0;i<cards.length;i++){
   const diff=i-current,selected=diff===0;
   // 保持半圆的整体位置，邻片让出阅读空间；每片始终独立。
   const baseAngle=-Math.PI/2+(i/(cards.length-1))*Math.PI;
   const spread=Math.abs(diff)===1?Math.sign(diff)*.07:0;
   const angle=THREE.MathUtils.clamp(baseAngle+spread,-Math.PI/2,Math.PI/2);
   const distance=selected?radius-.6:radius;
   targetPosition.set(selected?0:Math.sin(angle)*distance,1.56,selected?-3.3:-Math.cos(angle)*distance);
   cards[i].position.lerp(targetPosition,alpha);
   cards[i].rotation.y=THREE.MathUtils.lerp(cards[i].rotation.y,selected?0:-angle,alpha);
   const scale=selected?1.06:.92;targetScale.setScalar(scale);cards[i].scale.lerp(targetScale,alpha);
  }
  videoPlane.visible=!video.paused && video.readyState>=2;
 }
 // 初次加载直接落在展位上，避免切片堆叠闪现。
 update(10);
 const satellites=new THREE.Group();satellites.name='Reserved distributed source exhibits';
 return {group,satellites,cards,select,step:(direction:number)=>select(current+direction),get current(){return current;},update,
  dispose(){textures.forEach(t=>t.dispose());videoTexture.dispose();group.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();if(o.material!==backingMaterial)(o.material as THREE.Material).dispose();}});backingMaterial.dispose();}
 };
}
