import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { shortestRoute, pathLength, sampleRoute } from '../src/navigation.ts';
import type { WorldLayout, Point3 } from '../src/layout.ts';
const layout = JSON.parse(readFileSync(new URL('../public/models/world-layout.json', import.meta.url), 'utf8')) as WorldLayout;

test('Every destination has a connected walking route from the entrance', () => {
  for (const id of Object.keys(layout.destinations)) {
    const route = shortestRoute(layout.paths, 'entry', id);
    assert.equal(route[0], 'entry'); assert.equal(route.at(-1), id);
    for (let i = 1; i < route.length; i++) assert.ok(layout.paths[`${route[i - 1]}-${route[i]}`] || layout.paths[`${route[i]}-${route[i - 1]}`]);
  }
  assert.deepEqual(shortestRoute(layout.paths, 'interview', 'north'), ['interview', 'court', 'mezzanine', 'north']);
  assert.deepEqual(shortestRoute(layout.paths, 'entry', 'missing'), []);
});

test('Routes land at their destination with a consistent human eye height', () => {
  for (const [key, points] of Object.entries(layout.paths)) {
    const ids = key.split('-');
    for (const [index, endpoint] of [[0, points[0]], [1, points.at(-1)!]] as const) {
      const camera = layout.destinations[ids[index]].position;
      assert.ok(Math.abs(camera[0] - endpoint[0]) < 0.01 && Math.abs(camera[2] - endpoint[2]) < 0.01, `${key} endpoint alignment`);
      assert.ok(camera[1] - endpoint[1] >= 1.65 && camera[1] - endpoint[1] <= 2.2, `${key} eye height`);
    }
  }
});

test('Upper rooms are connected by an actual gentle ramp without vertical jumps', () => {
  let elevationGain = 0;
  for (const [key, points] of Object.entries(layout.paths)) {
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i]; const horizontal = Math.hypot(b[0] - a[0], b[2] - a[2]);
      assert.ok(horizontal > 0, `${key} has no vertical teleport`);
      assert.ok(Math.abs(b[1] - a[1]) / horizontal < 0.12, `${key} ramp slope < 12%`);
      elevationGain += Math.max(0, b[1] - a[1]);
    }
  }
  assert.ok(Math.abs(elevationGain - 4.5) < 0.001);
});

test('Sampling follows exported straight route segments and clamps endpoints', () => {
  const points: Point3[] = [[0, 0, 0], [10, 0, 0], [10, 0, 10]]; const out: Point3 = [0, 0, 0];
  assert.equal(pathLength(points), 20);
  sampleRoute(points, 5, out); assert.deepEqual(out, [5, 0, 0]);
  sampleRoute(points, 15, out); assert.deepEqual(out, [10, 0, 5]);
  sampleRoute(points, 25, out); assert.deepEqual(out, [10, 0, 10]);
  sampleRoute(points, -5, out); assert.deepEqual(out, [0, 0, 0]);
});
