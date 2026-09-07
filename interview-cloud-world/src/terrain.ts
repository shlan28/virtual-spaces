export interface Island {name:string;x:number;y:number;z:number;rx:number;rz:number;dome:number;depth:number;seed:number}
export interface WorldLayout {islands:Island[];route:number[][];routes:number[][][];platforms:Record<string,number[]>}
export function islandHeight(a:Island,x:number,z:number):number {
 const r2=((x-a.x)/a.rx)**2+((z-a.z)/a.rz)**2;
 return a.y+a.dome*Math.max(0,1-r2)+.28*Math.sin(x*.47)*Math.cos(z*.38)+.13*Math.sin(x*1.3+z*.53);
}
export function surfaceHeight(layout:WorldLayout,x:number,z:number):number {
 let height=-Infinity;
 for(const a of layout.islands) if(((x-a.x)/a.rx)**2+((z-a.z)/a.rz)**2<1.08**2) height=Math.max(height,islandHeight(a,x,z));
 return height;
}
export function seededRandom(seed:number):()=>number {return ()=>{seed|=0;seed=seed+0x6d2b79f5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
