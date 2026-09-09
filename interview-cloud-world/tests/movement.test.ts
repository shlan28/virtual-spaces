import assert from 'node:assert/strict';
import test from 'node:test';
import {diagonalScale, movementAxes, nextLateral} from '../src/movement';

test('maps WASD and arrow keys to forward and lateral axes', () => {
  assert.deepEqual(movementAxes(new Set(['KeyW', 'KeyA'])), {forward: 1, strafe: -1});
  assert.deepEqual(movementAxes(new Set(['KeyS', 'KeyD'])), {forward: -1, strafe: 1});
  assert.deepEqual(movementAxes(new Set(['ArrowUp'])), {forward: 1, strafe: 0});
});

test('normalizes diagonal movement and clamps lateral travel', () => {
  assert.equal(diagonalScale(1, 1), Math.SQRT1_2);
  assert.equal(diagonalScale(1, 0), 1);
  assert.equal(nextLateral(2.3, 1, 1, 2.4, 2.4), 2.4);
  assert.equal(nextLateral(-2.3, -1, 1, 2.4, 2.4), -2.4);
});
