import * as THREE from 'three';
import {insights} from './content';
import type {Point3} from './layout';

/** 在建筑中直接可读的概括；每件展品保留原始来源入口。 */
export function createExhibits(){
 const group=new THREE.Group(),interactive:THREE.Object3D[]=[],textures:THREE.Texture[]=[];
 function panel(title:string,lines:string[],eyebrow:string,p:Point3,w:number,h:number,action:Record<string,unknown>,rotation=0,clear=false){
  const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);const x=c.getContext('2d')!;
  if(!clear){x.fillStyle='#cbd3dc';x.fillRect(0,0,c.width,c.height);}
  x.fillStyle='#536675';x.font='25px sans-serif';x.fillText(eyebrow,55,65);
  let y=155;
  function write(str:string,size:number){x.font=`${size}px sans-serif`;let line='';for(const ch of str){if(x.measureText(line+ch).width>910){x.fillText(line,55,y);line=ch;y+=size*1.55;}else line+=ch;}x.fillText(line,55,y);y+=size*1.55;}
  x.fillStyle='#243b4c';write(title,66);y+=42;
  x.fillStyle='#536777';for(const line of lines){write(line,35);y+=20;}
  if(w<1.6){x.clearRect(0,0,c.width,c.height);x.fillStyle='#263d4b';x.font='210px sans-serif';x.textAlign='center';x.fillText(title,512,c.height*.55);clear=true;}
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;textures.push(tex);
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,transparent:clear,side:THREE.FrontSide,toneMapped:false}));
  mesh.position.fromArray(p);mesh.rotation.y=rotation;mesh.userData=action;group.add(mesh);interactive.push(mesh);return mesh;
 }
 panel('锦供参考',['关于创新者，','与他们正在创造的世界。','从一场对话，走向更多问题。'],'A MUSEUM OF CONVERSATIONS',[-3.01,2.7,22.34],4.8,3.0,{navigate:'court'},0,true);
 panel('01 / 创业的时间',['先行动，再调整','Vol.06 · 约 01:40 起'],'入口笔记',[-12.42,2.25,23],2.4,2.3,{chapter:0},Math.PI/2,true);
 panel('机器人是无数个行业',['王丛 · 地瓜机器人 CEO','八个片段 / 拨动选择 / 查看原片'],'锦供参考 VOL.06',[-24,4.15,-5.7],5.3,1.8,{chapter:2},0,true);
 const summaries=[['三个时间尺度','当下的业务','新的机会','长期的投入'],['从工具到生态','软件工具 → 开发效率','开发效率 → 量产支持'],['今天与未来','大客户带来当下订单','创新客户帮助发现新需求']];
 summaries.forEach((s,i)=>panel(s[0],s.slice(1).concat(['编辑整理 · 点击查看来源']),`FIELD NOTES / 0${i+1}`,[-4.95+i*3.9,2.4,-9.40],2.75,3.8,{insight:i+1}));
 const nodes:[string,Point3,number][]=[['机器人',[-3,.55,1],0],['平台',[1,1.1,-2.7],2],['组织',[3.2,.45,2],1]];
 const mat=new THREE.MeshStandardMaterial({color:0xc9d2df,roughness:.66,metalness:.12});
 const ballGeometry=new THREE.DodecahedronGeometry(1.08,0);
 for(const [title,p,i]of nodes){
  const ball=new THREE.Mesh(ballGeometry,mat);ball.position.fromArray(p);ball.rotation.y=.4;ball.castShadow=true;ball.userData.insight=i;group.add(ball);interactive.push(ball);
  panel(title,['阅读观点 →'],'THEMES',[p[0],p[1]+.05,p[2]+1.02],1.35,.88,{insight:i});
 }
 const rodMat=new THREE.MeshStandardMaterial({color:0x8a9baa,metalness:.65,roughness:.35});
 for(let i=0;i<3;i++){const x=-4.95+i*3.9;const support=new THREE.Mesh(new THREE.BoxGeometry(.12,.6,.18),rodMat);support.position.set(x,.3,-9.5);group.add(support);const foot=new THREE.Mesh(new THREE.BoxGeometry(1.1,.07,.65),rodMat);foot.position.set(x,.035,-9.5);group.add(foot);}
 for(const [a,b] of [[0,1],[1,2],[2,0]]){
  const from=new THREE.Vector3(...nodes[a][1]),to=new THREE.Vector3(...nodes[b][1]),d=to.clone().sub(from);
  const rod=new THREE.Mesh(new THREE.CylinderGeometry(.024,.024,d.length(),12),rodMat);rod.position.copy(from).add(to).multiplyScalar(.5);rod.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());group.add(rod);
 }
 panel('不同问题，同一场对话',['这些连接来自本期内容的编辑整理。','读到感兴趣的观点，再回到原片。'],'主题索引',[-.3,-.05,4.3],3.2,1.4,{insight:0},0);
 for(const [name,p]of [['东侧对话厅',[24,2.6,-4.6]],['上层档案室',[0,7.1,-28.6]]] as [string,Point3][]){
  panel('留给下一场对话',['新的嘉宾，新的问题。','待加入访谈'],'COMING NEXT',p,4,2.7,{pending:name},0,true);
 }
 panel('继续探索',['下一场对话 →'],'02 / EAST',[11.7,2.6,1.8],2.2,1.6,{navigate:'east'},-Math.PI/2,true);
 panel('未来档案',['上层展厅 →'],'03 / ARCHIVE',[-3,6.65,-17],2.4,1.5,{navigate:'north'},0,true);
 return {group,interactive,getInsight:(i:number)=>insights[i],dispose(){textures.forEach(t=>t.dispose());group.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(o.material as THREE.Material).dispose();}});}};
}
