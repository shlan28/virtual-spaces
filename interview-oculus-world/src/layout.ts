/** 米制、Y-up 布局与 Blender 导出共享，路线为地面高度。 */
export type Point3 = [number, number, number];
export interface Destination {name:string;description:string;position:Point3;target:Point3}
export interface WorldLayout {
 destinations:Record<string,Destination>;
 paths:Record<string,Point3[]>;
 interviewCenter:Point3;
 upcoming:Point3[];
 oculi:{center:Point3;radius:number}[];
}
export async function loadLayout():Promise<WorldLayout>{
 const response=await fetch('/models/world-layout.json');
 if(!response.ok)throw new Error('空间路线加载失败，请刷新重试。');
 const layout=await response.json() as WorldLayout;
 if(!layout.destinations?.entry||!layout.paths||!layout.interviewCenter)throw new Error('空间布局不完整。');
 return layout;
}
