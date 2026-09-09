import * as THREE from 'three';

export interface MovementAxes {forward:number;strafe:number}
export interface FreeMovementOptions {
  speed?:number;
  acceleration?:number;
  deceleration?:number;
  radius?:number;
  maxStepUp?:number;
  maxDrop?:number;
  fallbackGroundHeight?:(x:number,z:number)=>number;
}

export function movementAxes(keys:ReadonlySet<string>):MovementAxes {
  return {
    forward:Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown')),
    strafe:Number(keys.has('KeyD'))-Number(keys.has('KeyA')),
  };
}

export function planarMove(forwardX:number,forwardZ:number,axes:MovementAxes){
  const length=Math.hypot(forwardX,forwardZ)||1;
  const fx=forwardX/length,fz=forwardZ/length;
  const x=fx*axes.forward-fz*axes.strafe,z=fz*axes.forward+fx*axes.strafe;
  const magnitude=Math.hypot(x,z);
  return magnitude>1?{x:x/magnitude,z:z/magnitude}:{x,z};
}

export function smoothVelocity(current:number,target:number,response:number,delta:number){
  return THREE.MathUtils.lerp(current,target,1-Math.exp(-response*Math.max(0,delta)));
}

export function slideCandidates(x:number,z:number):Array<[number,number]>{
  return [[x,z],[x,0],[0,z]];
}

/** 以视角为基准移动；用实体网格完成地面跟随、墙体阻挡与贴墙滑动。 */
export class FreeMovement {
  private readonly colliders:THREE.Object3D[];
  private readonly velocity=new THREE.Vector3();
  private readonly desired=new THREE.Vector3();
  private readonly displacement=new THREE.Vector3();
  private readonly applied=new THREE.Vector3();
  private readonly candidate=new THREE.Vector3();
  private readonly direction=new THREE.Vector3();
  private readonly origin=new THREE.Vector3();
  private readonly down=new THREE.Vector3(0,-1,0);
  private readonly raycaster=new THREE.Raycaster();
  private eyeHeight:number|undefined;
  private readonly speed:number;
  private readonly acceleration:number;
  private readonly deceleration:number;
  private readonly radius:number;
  private readonly maxStepUp:number;
  private readonly maxDrop:number;

  constructor(colliders:THREE.Object3D[],private readonly options:FreeMovementOptions={}){
    this.colliders=colliders.filter(collider=>collider instanceof THREE.Mesh);
    this.speed=options.speed??4;
    this.acceleration=options.acceleration??13;
    this.deceleration=options.deceleration??18;
    this.radius=options.radius??.3;
    this.maxStepUp=options.maxStepUp??.65;
    this.maxDrop=options.maxDrop??1.15;
  }

  stop(){this.velocity.set(0,0,0);}

  sync(position:THREE.Vector3){
    this.stop();this.eyeHeight=undefined;
    const ground=this.groundHeight(position.x,position.z,position.y);
    if(ground!==undefined)this.eyeHeight=THREE.MathUtils.clamp(position.y-ground,1.55,2.45);
  }

  update(position:THREE.Vector3,facing:THREE.Vector3,axes:MovementAxes,delta:number){
    if(this.eyeHeight===undefined)this.sync(position);
    const move=planarMove(facing.x,facing.z,axes);
    this.desired.set(move.x*this.speed,0,move.z*this.speed);
    const response=move.x||move.z?this.acceleration:this.deceleration;
    this.velocity.x=smoothVelocity(this.velocity.x,this.desired.x,response,delta);
    this.velocity.z=smoothVelocity(this.velocity.z,this.desired.z,response,delta);
    if(Math.hypot(this.velocity.x,this.velocity.z)<.015)this.velocity.set(0,0,0);
    this.displacement.copy(this.velocity).multiplyScalar(delta);
    this.applied.set(0,0,0);
    if(this.displacement.lengthSq()===0||this.eyeHeight===undefined)return this.applied;
    for(const [x,z] of slideCandidates(this.displacement.x,this.displacement.z)){
      if(Math.abs(x)+Math.abs(z)<1e-6)continue;
      const resolved=this.resolve(position,x,z,delta);
      if(resolved){
        this.applied.subVectors(resolved,position);
        if(x!==this.displacement.x)this.velocity.x*=.35;
        if(z!==this.displacement.z)this.velocity.z*=.35;
        return this.applied;
      }
    }
    this.velocity.multiplyScalar(.2);
    return this.applied;
  }

  private resolve(position:THREE.Vector3,x:number,z:number,delta:number){
    if(this.wallBlocked(position,x,z))return undefined;
    this.candidate.set(position.x+x,position.y,position.z+z);
    const ground=this.groundHeight(this.candidate.x,this.candidate.z,position.y);
    if(ground===undefined||this.eyeHeight===undefined)return undefined;
    const targetY=ground+this.eyeHeight,vertical=targetY-position.y;
    if(vertical>this.maxStepUp||vertical< -this.maxDrop)return undefined;
    this.candidate.y=smoothVelocity(position.y,targetY,14,delta);
    return this.candidate;
  }

  private wallBlocked(position:THREE.Vector3,x:number,z:number){
    const distance=Math.hypot(x,z);
    this.direction.set(x/distance,0,z/distance);
    for(const fraction of [.32,.68]){
      this.origin.copy(position);this.origin.y-=(this.eyeHeight??2)*fraction;
      this.raycaster.set(this.origin,this.direction);this.raycaster.near=0;this.raycaster.far=distance+this.radius;
      if(this.raycaster.intersectObjects(this.colliders,false).length)return true;
    }
    return false;
  }

  private groundHeight(x:number,z:number,currentEyeY:number){
    this.origin.set(x,currentEyeY+this.maxStepUp,z);
    this.raycaster.set(this.origin,this.down);
    this.raycaster.near=0;this.raycaster.far=(this.eyeHeight??2.45)+this.maxStepUp+this.maxDrop;
    const hit=this.raycaster.intersectObjects(this.colliders,false)[0];
    if(hit)return hit.point.y;
    const fallback=this.options.fallbackGroundHeight?.(x,z);
    return fallback!==undefined&&Number.isFinite(fallback)?fallback:undefined;
  }
}
