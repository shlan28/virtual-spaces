import * as THREE from 'three';
import {insights} from './content';
import {destinations} from './navigation';

function textTexture(title:string,lines:string[],label:string,width=640,height=860){
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d')!;
 ctx.fillStyle='#edf0e4';ctx.fillRect(0,0,width,height);ctx.strokeStyle='#a9b9ad';ctx.lineWidth=2;ctx.strokeRect(18,18,width-36,height-36);
 ctx.fillStyle='#567671';ctx.font='20px sans-serif';ctx.fillText(label,45,68);
 ctx.fillStyle='#254e4f';ctx.font='38px serif';let y=140;
 function wrap(text:string,font:string,lineHeight:number){ctx.font=font;let line='';for(const ch of text){if(ctx.measureText(line+ch).width>width-90){ctx.fillText(line,45,y);y+=lineHeight;line=ch;}else line+=ch;}ctx.fillText(line,45,y);y+=lineHeight;}
 wrap(title,'38px serif',55);y+=35;ctx.strokeStyle='#c1c9b8';ctx.beginPath();ctx.moveTo(45,y);ctx.lineTo(width-45,y);ctx.stroke();y+=55;ctx.fillStyle='#58716a';for(const line of lines){wrap(line,'25px sans-serif',42);y+=20;}
 ctx.font='20px sans-serif';ctx.fillStyle='#527371';ctx.fillText('点击，继续探索  ↗',45,height-50);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
}

export function createExhibits(){
 const group=new THREE.Group();group.name='Ideas and destinations';const interactive:THREE.Object3D[]=[];const labels:THREE.Sprite[]=[];
 function panel(title:string,lines:string[],label:string,p:number[],w:number,h:number,action:Record<string,unknown>,rotation=0){
  const frame=new THREE.Group();frame.position.fromArray(p);frame.rotation.y=rotation;
  const board=new THREE.Mesh(new THREE.BoxGeometry(w+.06,h+.06,.10),new THREE.MeshStandardMaterial({color:0xb9c5b4,roughness:.35,metalness:.2}));board.castShadow=true;frame.add(board);
  const front=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:textTexture(title,lines,label),toneMapped:false}));front.position.z=.056;front.userData=action;frame.add(front);interactive.push(front);group.add(frame);return frame;
 }
 panel('思想，连成群岛',['锦供参考','关于创业、科技与未来的对话','沿着小径，发现值得继续追问的问题。'],'CONVERSATIONS IN THE CLOUDS',[-3.6,6.9,17],1.6,2.3, {navigate:'overview'},.18);
 panel('同时经营三个时间尺度',['01  成熟业务 · 确定性','02  新硬件 · 新机会','03  具身 · 长期未来','地瓜内部业务分类 · 编辑整理'],'THE THREE HORIZONS',[5,11,0],2.15,3.25,{insight:1},.30);
 panel('工具如何长成生态？',['软件工具','↓','开发效率','↓','支持量产'],'IDEAS / 平台与生态',[-3,9.8,3],1.6,2.8,{insight:2},-.20);
 panel('下一场对话，留在云端',['新的嘉宾与问题','将在这里继续生长。','待加入访谈'],'COMING NEXT',[18,16,-26],2.5,3.6,{pending:true});
 for(let i=0;i<5;i++){
  const angle=(i-2)*.46;
  panel('待加入访谈',['更多声音','更多值得追问的问题'],'COMING NEXT',[18+Math.sin(angle)*4,15.05,-23-Math.cos(angle)*4],1.2,2.2,{pending:true},-angle);
 }
 // Connected nodes express the multiple-application thesis and all link to its source.
 const graph=new THREE.Group();graph.position.set(10,10,0);group.add(graph);
 const nodePositions=[[0,1,0],[-1.8,2.8,0],[1.5,2.5,0],[-2,.2,0],[2,.1,0],[.8,-1.2,0]];
 const nodeMaterial=new THREE.MeshPhysicalMaterial({color:0xb4d5c9,metalness:.18,roughness:.18,transparent:true,opacity:.82,clearcoat:1});
 nodePositions.forEach((p,i)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(i===0?.4:.26,20,14),nodeMaterial);m.position.fromArray(p);m.userData.insight=0;graph.add(m);interactive.push(m);if(i){const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...nodePositions[0] as [number,number,number]),m.position]),new THREE.LineBasicMaterial({color:0xbfc7a3}));graph.add(line);}});
 panel('无数种场景，共享一些底层能力',['应用各不相同，工具可以连接。','来自机器人访谈的整理概括'],'ROBOTICS',[10,8.2,1],2.6,1.9,{insight:0},.25);
 const spriteTex=(text:string,sub:string)=>{const c=document.createElement('canvas');c.width=640;c.height=156;const x=c.getContext('2d')!;x.fillStyle='rgba(247,247,230,.94)';x.beginPath();x.roundRect(4,4,632,148,70);x.fill();x.fillStyle='#315e60';x.font='38px serif';x.textAlign='center';x.fillText(text,320,69);x.font='22px sans-serif';x.fillStyle='#6d8780';x.fillText(sub,320,109);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;};
 const places=[{id:'interview',p:[-24,9.1,5],title:'机器人时代',sub:'VOL.06  /  王丛'},{id:'arch',p:[-8,16.5,-7],title:'问题之门',sub:'探索观点之间的连接'},{id:'summit',p:[18,20,-23],title:'下一场对话',sub:'COMING NEXT'}];
 places.forEach(p=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:spriteTex(p.title,p.sub),depthTest:true,transparent:true}));s.scale.set(4.8,1.17,1);s.position.fromArray(p.p);s.userData.navigate=p.id;labels.push(s);interactive.push(s);group.add(s);});
 // Small destination pins provide direct movement without forcing long walks.
 Object.entries(destinations).filter(([key])=>key!=='overview'&&key!=='entry').forEach(([id,d])=>{const pin=new THREE.Mesh(new THREE.TorusGeometry(.22,.035,8,32),new THREE.MeshBasicMaterial({color:0xffedbc}));pin.position.fromArray(d.target);pin.position.y-=1.2;pin.userData.navigate=id;interactive.push(pin);group.add(pin);});
 return {group,interactive,update(camera:THREE.Camera,time:number){labels.forEach(s=>{const distance=s.position.distanceTo(camera.position);s.visible=distance<115;s.material.opacity=THREE.MathUtils.clamp((distance-3)/5,0,1);});graph.rotation.y=Math.sin(time*.12)*.1;},
  getInsight:(i:number)=>insights[i]
 };
}
