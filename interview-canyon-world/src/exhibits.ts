import * as THREE from 'three';
import {insights} from './content';
import {lightPath} from './effects';
import type {Point3} from './layout';

/** 内容平面独立于岩石贴图，保证正文可读且来源可更新。 */
function labelTexture(title:string,lines:string[],eyebrow:string,transparent=false,aspect=1){
 const c=document.createElement('canvas');c.width=768;c.height=Math.round(768/aspect);const width=c.width,height=c.height;const x=c.getContext('2d')!;
 if(!transparent){x.fillStyle='#dbcfbb';x.fillRect(0,0,width,height);x.strokeStyle='#9c8667';x.lineWidth=2;x.strokeRect(20,20,width-40,height-40);}
 x.fillStyle='#8c6849';x.font='25px sans-serif';x.fillText(eyebrow,50,70);x.fillStyle='#4a4038';
 let y=145;
 const wrap=(str:string,size:number)=>{x.font=`${size}px serif`;let line='';for(const ch of str){if(x.measureText(line+ch).width>width-100){x.fillText(line,50,y);y+=size*1.6;line=ch;}else line+=ch;}x.fillText(line,50,y);y+=size*1.6;};
 wrap(title,aspect<.7?120:60);y+=60;for(const line of lines){wrap(line,aspect<.7?80:40);y+=36;}
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;return tex;
}
export function createExhibits(){
 const group=new THREE.Group(),interactive:THREE.Object3D[]=[];const textures:THREE.Texture[]=[];
 function panel(title:string,lines:string[],label:string,p:Point3,w:number,h:number,action:Record<string,unknown>,rotation=0,transparent=false){
  const tex=labelTexture(title,lines,label,transparent,w/h);textures.push(tex);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,transparent,side:THREE.DoubleSide,toneMapped:false}));m.position.fromArray(p);m.rotation.y=rotation;m.userData=action;group.add(m);interactive.push(m);return m;
 }
 panel('一场对话，打开一个世界',['沿着光路，发现访谈与观点。','当前展出 / 王丛 · 地瓜机器人'],'THE CANYON OF CONVERSATIONS',[8,3.2,37],1.8,2.8,{navigate:'interview'},.25);
 panel('机器人时代',['王丛 · 地瓜机器人 CEO','Vol.06','拨动独立切片，进入你关心的段落。'],'CONVERSATION  /  01',[-13,9.8,9.1],6,2.6,{navigate:'interview'},0,true);
 panel('软件工具，如何支持量产？',['软件与工具 → 开发效率 → 量产支持','这是本期访谈中的论述。','编辑整理 · 约 29:44—34:08'],'FIELD NOTES  /  平台与生态',[-5.8,12.2,9.1],5,5.6,{insight:2},0,true);
 // 主分支是可读的关系而非装饰闪电；每条结点保留同一来源。
 const trunk:Point3[]=[[-21,9,9.05],[-20.5,11,9.05],[-19.5,13,9.05],[-20,15,9.05],[-19.5,18,9.05]];
 group.add(lightPath(trunk,.024));
 for(const [a,b]of [[[-20.5,11,9.05],[-17.9,12,9.05]],[[-19.5,13,9.05],[-22,14.5,9.05]],[[-20,15,9.05],[-17.5,16,9.05]]] as [Point3,Point3][]){group.add(lightPath([a,b],.015));}
 panel('同时经营三个时间尺度',['01  成熟业务 / 当下','02  新硬件 / 新机会','03  具身 / 长期投入','地瓜内部分类 · 编辑整理'],'THREE HORIZONS',[-20,19.5,9.15],4.8,5,{insight:1},0,true);
 panel('大客户',['今天的订单','支持当下业务','与规模化交付'],'两种客户 / 同一段对话',[14,2.65,3.46],1.86,3.8,{insight:3},0,false);
 panel('创新客户',['未来的需求','帮助发现新机会','与新的产品方向'],'约 50:56—55:44',[16.7,2.65,3.46],1.86,3.8,{insight:3},0,false);
 panel('对照，不是二选一',[],'FIELD NOTES',[15.3,5.6,3.5],4.3,1.6,{insight:3},0,false);
 panel('下一场对话',['这里留给新的嘉宾与问题。','待加入访谈'],'COMING NEXT',[7,11.4,-55],4,3.2,{pending:true});
 for(let i=0;i<4;i++){const a=(i-1.5)*.45;panel('待加入',['新的访谈','新的视角'],'COMING NEXT',[7+Math.sin(a)*6,9.5,-52-Math.cos(a)*4],1.4,2.5,{pending:true},-a);}
 return {group,interactive,getInsight:(i:number)=>insights[i],update(_camera:THREE.Camera,_time:number){},dispose(){textures.forEach(t=>t.dispose());group.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(o.material as THREE.Material).dispose();}});}};
}
