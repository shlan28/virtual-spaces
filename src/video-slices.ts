import * as THREE from 'three';
import {chapters,formatTime} from './content';

function cardTexture(atlas:HTMLImageElement,index:number){
 const c=document.createElement('canvas');c.width=512;c.height=896;const x=c.getContext('2d')!,chapter=chapters[index];
 x.fillStyle='#e8e5d8';x.fillRect(0,0,512,896);
 x.strokeStyle='#a4afa5';x.lineWidth=2;x.strokeRect(14,14,484,868);
 x.fillStyle='#577276';x.font='22px sans-serif';x.fillText(`VOL.06     /     ${String(index+1).padStart(2,'0')}`,40,64);
 const sx=(index%4)*512,sy=Math.floor(index/4)*288;x.drawImage(atlas,sx,sy,512,288,24,95,464,261);
 x.fillStyle='#244b4b';x.font='32px serif';
 const chars=[...chapter.title];let line='',y=420;for(const ch of chars){if(x.measureText(line+ch).width>430){x.fillText(line,40,y);line=ch;y+=48;}else line+=ch;}x.fillText(line,40,y);
 x.fillStyle='#738582';x.font='21px sans-serif';x.fillText('王丛 · 地瓜机器人',40,600);x.fillText(`${formatTime(chapter.start)} — ${formatTime(chapter.end)}`,40,642);
 x.strokeStyle='#a5b0a4';x.beginPath();x.moveTo(40,701);x.lineTo(472,701);x.stroke();
 x.fillStyle='#325855';x.beginPath();x.arc(256,783,28,0,Math.PI*2);x.fill();x.fillStyle='#f6f1df';x.beginPath();x.moveTo(250,771);x.lineTo(250,795);x.lineTo(268,783);x.fill();
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
export async function createVideoSlices(video:HTMLVideoElement,center:number[]){
 const group=new THREE.Group();group.position.fromArray(center);group.name='Independent semicircle video chapters';
 const atlas=new Image();atlas.src='/media/chapter-atlas.jpg';await atlas.decode();
 const cards:THREE.Group[]=[],covers:THREE.Mesh[]=[],textures:THREE.Texture[]=[];
 const backingMaterial=new THREE.MeshStandardMaterial({color:0xc6c9b8,metalness:.3,roughness:.4});
 const videoTexture=new THREE.VideoTexture(video);videoTexture.colorSpace=THREE.SRGBColorSpace;
 const videoPlane=new THREE.Mesh(new THREE.PlaneGeometry(1.50,.844),new THREE.MeshBasicMaterial({map:videoTexture,toneMapped:false}));videoPlane.position.set(0,.765,.077);videoPlane.visible=false;
 let current=2;
 for(let i=0;i<chapters.length;i++){
  const card=new THREE.Group(),texture=cardTexture(atlas,i);textures.push(texture);
  const back=new THREE.Mesh(new THREE.BoxGeometry(1.69,2.96,.09),backingMaterial);back.castShadow=true;card.add(back);
  const front=new THREE.Mesh(new THREE.PlaneGeometry(1.66,2.92),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));front.position.z=.049;front.userData.chapter=i;back.userData.chapter=i;card.add(front);covers.push(front);
  const foot=new THREE.Mesh(new THREE.BoxGeometry(.65,.07,.55),backingMaterial);foot.position.y=-1.5;card.add(foot);cards.push(card);group.add(card);
 }
 const halo=new THREE.Mesh(new THREE.RingGeometry(4.62,4.65,128),new THREE.MeshBasicMaterial({color:0xe3cd98,side:THREE.DoubleSide,transparent:true,opacity:.7}));halo.rotation.x=-Math.PI/2;halo.position.y=.05;group.add(halo);
 function select(index:number){current=THREE.MathUtils.clamp(index,0,cards.length-1);cards[current].add(videoPlane);}
 select(current);
 function update(dt:number){
  for(let i=0;i<cards.length;i++){
   const diff=i-current,a=diff*.29;const selected=i===current;
   const target=new THREE.Vector3(Math.sin(a)*4.7,1.56,-Math.cos(a)*4.7+(selected?.55:0));
   const alpha=1-Math.exp(-dt*8);cards[i].position.lerp(target,alpha);cards[i].rotation.y=THREE.MathUtils.lerp(cards[i].rotation.y,-a,alpha);const s=selected?1.1:.94;cards[i].scale.lerp(new THREE.Vector3(s,s,s),alpha);
  }
  videoPlane.visible=!video.paused && video.readyState>=2;
 }
 // Set initial transforms immediately to avoid a pile of cards during loading.
 update(10);
 // Additional local entry points use the same source identity, not fabricated episodes.
 const satellites=new THREE.Group();satellites.name='Distributed interview entry points';
 for(const [j,index]of [4,6,7].entries()){
  const a=(j-1)*.40,m=new THREE.Mesh(new THREE.PlaneGeometry(1.5,2.64),new THREE.MeshBasicMaterial({map:textures[index],side:THREE.DoubleSide,toneMapped:false}));
  m.position.set(11+Math.sin(a)*3.5,8.8,7-Math.cos(a)*3.5);m.rotation.y=-a;m.userData.chapter=index;satellites.add(m);
 }
 return {group,satellites,cards,select,step:(direction:number)=>select(current+direction),get current(){return current;},update,
  dispose(){textures.forEach(t=>t.dispose());videoTexture.dispose();group.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();if(o.material!==backingMaterial)(o.material as THREE.Material).dispose();}});backingMaterial.dispose();}
 };
}
