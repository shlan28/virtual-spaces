import assert from 'node:assert/strict';
import test from 'node:test';
import {diagonalScale, nextLateral} from '../src/movement';

test('normalizes diagonal movement', () => {
  assert.equal(diagonalScale(1, 1), Math.SQRT1_2);
  assert.equal(diagonalScale(1, 0), 1);
});

test('clamps movement to the route width', () => {
  assert.equal(nextLateral(1.3, 1, 1, 2.6, 1.35), 1.35);
  assert.equal(nextLateral(-1.3, -1, 1, 2.6, 1.35), -1.35);
});
