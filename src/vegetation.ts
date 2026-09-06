import * as THREE from 'three';
import {WorldLayout,surfaceHeight,seededRandom} from './terrain';

export function createVegetation(layout:WorldLayout) {
 const group=new THREE.Group();group.name='Meadow and crystal gardens';
 const rand=seededRandom(2921), dummy=new THREE.Object3D(),color=new THREE.Color();
 const routeCurves=layout.routes.map(p=>new THREE.CatmullRomCurve3(p.map(v=>new THREE.Vector3(...v as [number,number,number]))));
 const routePoints=routeCurves.flatMap(c=>c.getPoints(170));
 function clear(x:number,z:number){
  if(routePoints.some(p=>(p.x-x)**2+(p.z-z)**2<2.05**2))return false;
  for(const p of Object.values(layout.platforms))if((p[0]-x)**2+(p[2]-z)**2<28)return false;
  return true;
 }
 const points:THREE.Vector3[]=[];
 for(const island of layout.islands){
  const count=island.name.startsWith('Far')?450:2400;
  for(let i=0;i<count;i++){
   const t=rand()*Math.PI*2,r=Math.sqrt(rand())*.92,x=island.x+Math.cos(t)*r*island.rx,z=island.z+Math.sin(t)*r*island.rz;
   if(!clear(x,z))continue;
   const y=surfaceHeight(layout,x,z);if(Number.isFinite(y))points.push(new THREE.Vector3(x,y-.025,z));
  }
 }
 // Each grass tuft has three bent blades, rendered as a single instanced batch.
 const verts:number[]=[],indices:number[]=[];
 for(let k=0;k<3;k++){
  const a=k*Math.PI*2/3,dx=Math.cos(a),dz=Math.sin(a),s=verts.length/3;
  verts.push(-.07*dx,0,-.07*dz,.07*dx,0,.07*dz,.035*dx,.3,.035*dz,-.035*dx,.3,-.035*dz,.16*dx,.63,.16*dz);
  indices.push(s,s+1,s+2,s,s+2,s+3,s+3,s+2,s+4);
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();
 const mat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,side:THREE.DoubleSide});
 const grass=new THREE.InstancedMesh(geo,mat,points.length);
 points.forEach((p,i)=>{dummy.position.copy(p);const h=.28+rand()*.7;dummy.scale.set(h,h*(.7+rand()*.5),h);dummy.rotation.set(0,rand()*6.28,0);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);color.setHSL(.20+rand()*.08,.24+rand()*.2,.16+rand()*.14);grass.setColorAt(i,color);});
 grass.receiveShadow=true;group.add(grass);
 const flowerCount=Math.floor(points.length*.34);
 const petals=new THREE.InstancedMesh(new THREE.SphereGeometry(1,6,3),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.8}),flowerCount*5);
 const centers=new THREE.InstancedMesh(new THREE.SphereGeometry(1,6,4),new THREE.MeshStandardMaterial({color:0xe9c46c,roughness:.8}),flowerCount);
 for(let i=0;i<flowerCount;i++){
  const p=points[Math.floor(rand()*points.length)],h=.16+rand()*.45,s=.045+rand()*.055;
  const palette=[0xfff3dc,0xf4d0cb,0xdbbbd4,0xe7dfb6];color.setHex(palette[i%4]);
  for(let j=0;j<5;j++){const a=j/5*6.28;dummy.position.set(p.x+Math.cos(a)*s*.9,p.y+h,p.z+Math.sin(a)*s*.9);dummy.scale.set(s,.018,s*.7);dummy.rotation.set(0,-a,0);dummy.updateMatrix();petals.setMatrixAt(i*5+j,dummy.matrix);petals.setColorAt(i*5+j,color);}
  dummy.position.set(p.x,p.y+h+.015,p.z);dummy.scale.setScalar(s*.45);dummy.updateMatrix();centers.setMatrixAt(i,dummy.matrix);
 }
 group.add(petals,centers);
 // Faceted mineral clusters frame the foreground and mark the summit.
 const crystalMat=new THREE.MeshPhysicalMaterial({color:0xe6aaa8,metalness:.08,roughness:.21,clearcoat:.7,clearcoatRoughness:.18});
 const quartz=new THREE.CylinderGeometry(.40,.48,2.0,6,1);quartz.translate(0,1,0);
 const qpos=quartz.attributes.position;for(let i=0;i<qpos.count;i++){if(qpos.getY(i)>1.99){qpos.setY(i,2.0+(qpos.getX(i)+.4)*.6);}}quartz.computeVertexNormals();
 const crystals=new THREE.InstancedMesh(quartz,crystalMat,80);
 const locations=[[-5,23],[6,20],[22,-18],[-28,9],[13,5]];
 for(let i=0;i<80;i++){const loc=locations[Math.floor(i/16)],x=loc[0]+(rand()-.5)*3,z=loc[1]+(rand()-.5)*3;dummy.position.set(x,surfaceHeight(layout,x,z)-.2,z);dummy.rotation.set((rand()-.5)*.7,rand()*6.28,(rand()-.5)*.7);dummy.scale.setScalar(.3+rand()*1.1);dummy.updateMatrix();crystals.setMatrixAt(i,dummy.matrix);color.setHSL(.96+rand()*.06,.23,.65+rand()*.18);crystals.setColorAt(i,color);}
 crystals.castShadow=true;crystals.receiveShadow=true;group.add(crystals);
 const rockMat=new THREE.MeshStandardMaterial({color:0xb5c0b3,roughness:.95});
 const rocks=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),rockMat,160);
 for(let i=0;i<160;i++){const p=points[Math.floor(rand()*points.length)];dummy.position.copy(p).add(new THREE.Vector3(0,-.08,0));dummy.rotation.set(rand(),rand()*6.28,rand());const s=.2+rand()*.65;dummy.scale.set(s,s*.65,s*.8);dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);color.setHSL(.13,.1,.47+rand()*.22);rocks.setColorAt(i,color);}
 rocks.receiveShadow=true;rocks.castShadow=true;group.add(rocks);
 // Branching trees with many small leaves rather than large placeholder spheres.
 const bark=new THREE.MeshStandardMaterial({color:0x746b59,roughness:1});
 const leafGeometry=new THREE.IcosahedronGeometry(1,1);
 const leavesData:{p:THREE.Vector3;s:THREE.Vector3;pink:boolean}[]=[];
 function branch(a:THREE.Vector3,b:THREE.Vector3,r1:number,r2:number){const d=b.clone().sub(a),m=new THREE.Mesh(new THREE.CylinderGeometry(r2,r1,d.length(),7),bark);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());m.castShadow=true;group.add(m);}
 const trees=[[-7,18,3.5,1],[9,8,4,0],[25,-21,4.8,1],[9,-21,3.6,0],[-29,3,3,0],[-12,-12,3.9,0],[-2,-11,2.6,1],[-51,-36,4,0],[45,-48,4,0]];
 for(const [x,z,h,pink]of trees){const y=surfaceHeight(layout,x,z);if(!Number.isFinite(y))continue;const origin=new THREE.Vector3(x,y,z),top=origin.clone().add(new THREE.Vector3(.3,h*.67,.2));branch(origin,top,.2,.10);
  for(let k=0;k<7;k++){const a=k/7*6.28+rand()*.5,end=top.clone().add(new THREE.Vector3(Math.cos(a)*h*.48,h*(.12+rand()*.24),Math.sin(a)*h*.48));branch(top,end,.09,.02);
   const tip=end.clone().add(new THREE.Vector3(.1,h*.09,0));
   for(let j=0;j<180;j++){const theta=rand()*6.28,r=Math.sqrt(rand())*h*.31,dy=(rand()-.5)*h*.30;leavesData.push({p:tip.clone().add(new THREE.Vector3(Math.cos(theta)*r,dy,Math.sin(theta)*r)),s:new THREE.Vector3(.055+rand()*.115,.02+rand()*.055,.05+rand()*.10),pink:!!pink});}
  }
 }
 const leaves=new THREE.InstancedMesh(leafGeometry,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.85}),leavesData.length);
 leavesData.forEach((l,i)=>{dummy.position.copy(l.p);dummy.scale.copy(l.s);dummy.rotation.set(rand()*3,rand()*6,rand()*3);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);color.setHSL(l.pink?.96+rand()*.04:.20+rand()*.08,l.pink?.23:.27,l.pink?.46+rand()*.15:.11+rand()*.12);leaves.setColorAt(i,color);});
 leaves.castShadow=true;group.add(leaves);
 return {group,setLowQuality(low:boolean){grass.count=low?Math.floor(points.length*.5):points.length;leaves.castShadow=!low;}};
}
