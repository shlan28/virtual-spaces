import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import {FreeMovement,movementAxes,planarMove,slideCandidates,smoothVelocity} from '../src/movement';

test('maps WASD and arrow keys to movement axes',()=>{
  assert.deepEqual(movementAxes(new Set(['KeyW','KeyA'])),{forward:1,strafe:-1});
  assert.deepEqual(movementAxes(new Set(['KeyS','KeyD'])),{forward:-1,strafe:1});
  assert.deepEqual(movementAxes(new Set(['ArrowUp'])),{forward:1,strafe:0});
});

test('moves relative to the current view and normalizes diagonals',()=>{
  assert.deepEqual(planarMove(0,-1,{forward:1,strafe:0}),{x:0,z:-1});
  assert.deepEqual(planarMove(0,-1,{forward:0,strafe:1}),{x:1,z:0});
  const diagonal=planarMove(0,-1,{forward:1,strafe:1});
  assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.z)-1)<1e-10);
});

test('smooths acceleration and offers axis-separated wall sliding',()=>{
  const accelerated=smoothVelocity(0,4,13,.05);
  assert.ok(accelerated>0&&accelerated<4);
  assert.ok(smoothVelocity(accelerated,0,18,.05)<accelerated);
  assert.deepEqual(slideCandidates(2,3),[[2,3],[2,0],[0,3]]);
});

test('follows valid ground and refuses movement into a void',()=>{
  const movement=new FreeMovement([],{speed:4,fallbackGroundHeight:(x)=>x<.18?0:Number.NEGATIVE_INFINITY});
  const position=new THREE.Vector3(0,2,0),facing=new THREE.Vector3(1,0,0);
  movement.sync(position);
  for(let i=0;i<20;i++)position.add(movement.update(position,facing,{forward:1,strafe:0},.05));
  assert.ok(position.x>0);
  assert.ok(position.x<.18);
  assert.equal(position.y,2);
});

test('blocks forward motion at a fixed wall',()=>{
  const wall=new THREE.Mesh(new THREE.PlaneGeometry(4,4),new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
  wall.rotation.y=Math.PI/2;wall.position.set(.5,2,0);wall.updateMatrixWorld(true);
  const movement=new FreeMovement([wall],{speed:4,fallbackGroundHeight:()=>0});
  const position=new THREE.Vector3(0,2,0),facing=new THREE.Vector3(1,0,0);
  movement.sync(position);
  for(let i=0;i<20;i++)position.add(movement.update(position,facing,{forward:1,strafe:0},.05));
  assert.ok(position.x<.5);
});
