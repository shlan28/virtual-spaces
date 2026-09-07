/** Read-only architecture audit. Run: npx tsx scripts/check-routes.ts */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { DoubleSide, Mesh, Raycaster, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { WorldLayout, Point3 } from '../src/layout';

interface Issue { kind: 'wall' | 'support' | 'headroom'; object: string; segment: number; point: Point3; detail: string }
const modelPath = resolve('public/models/oculus-world.glb');
const bytes = readFileSync(modelPath);
const scene = (await new GLTFLoader().parseAsync(Uint8Array.from(bytes).buffer, '')).scene;
scene.updateMatrixWorld(true);
const meshes: Mesh[] = [];
scene.traverse(object => {
  if (object instanceof Mesh) {
    meshes.push(object);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.side = DoubleSide;
  }
});
const layout = JSON.parse(readFileSync('public/models/world-layout.json', 'utf8')) as WorldLayout;
const ray = new Raycaster();
const down = new Vector3(0, -1, 0), up = new Vector3(0, 1, 0);
const roundPoint = (point: Vector3): Point3 => [Number(point.x.toFixed(3)), Number(point.y.toFixed(3)), Number(point.z.toFixed(3))];
const routes: { id: string; length: number; samples: number; issues: Issue[] }[] = [];
for (const [id, points] of Object.entries(layout.paths)) {
  const [from, to] = id.split('-');
  const startEye = layout.destinations[from].position[1] - points[0][1];
  const endEye = layout.destinations[to].position[1] - points[points.length - 1][1];
  const total = points.slice(1).reduce((sum, point, index) => sum + new Vector3(...point).distanceTo(new Vector3(...points[index])), 0);
  let traversed = 0, samples = 0;
  const issues: Issue[] = [];
  const addIssue = (issue: Issue) => {
    if (!issues.some(item => item.kind === issue.kind && item.object === issue.object && item.segment === issue.segment)) issues.push(issue);
  };
  for (let i = 1; i < points.length; i++) {
    const a = new Vector3(...points[i - 1]), b = new Vector3(...points[i]);
    const length = a.distanceTo(b), ea = a.clone(), eb = b.clone();
    ea.y += startEye + (endEye - startEye) * traversed / total;
    eb.y += startEye + (endEye - startEye) * (traversed + length) / total;
    const direction = eb.clone().sub(ea).normalize();
    const side = new Vector3(-direction.z, 0, direction.x).normalize();
    // Check eye and torso, including a narrow camera/body envelope beside the route.
    for (const height of [0, -0.6]) for (const offset of [-0.16, 0, 0.16]) {
      const start = ea.clone().addScaledVector(side, offset); start.y += height;
      ray.set(start, direction); ray.near = 0.02; ray.far = ea.distanceTo(eb) - 0.02;
      for (const hit of ray.intersectObjects(meshes, false)) {
        addIssue({kind: 'wall', object: hit.object.name, segment: i, point: roundPoint(hit.point), detail: `Route intersects architecture at eye offset ${height} m, side offset ${offset} m.`});
      }
    }
    const count = Math.ceil(length / 0.15);
    for (let j = 0; j <= count; j++) {
      samples++;
      const t = j / count, floorPoint = a.clone().lerp(b, t), eyePoint = floorPoint.clone();
      const eye = startEye + (endEye - startEye) * (traversed + length * t) / total;
      eyePoint.y += eye;
      ray.set(eyePoint, down); ray.near = 0.005; ray.far = eye + 1;
      let support = ray.intersectObjects(meshes, false)[0];
      // Sub-centimeter mesh-center holes and bevel seams do not make a real footfall unsupported.
      if (!support) {
        for (const dx of [-0.015, 0.015]) {
          const offsetPoint = eyePoint.clone(); offsetPoint.x += dx; ray.set(offsetPoint, down);
          const nearby = ray.intersectObjects(meshes, false)[0];
          if (nearby && Math.abs(nearby.point.y - floorPoint.y) <= 0.2) { support = nearby; break; }
        }
      }
      if (!support || Math.abs(support.point.y - floorPoint.y) > 0.2) {
        addIssue({kind: 'support', object: support?.object.name ?? 'NO FLOOR', segment: i, point: roundPoint(floorPoint), detail: support ? `Expected floor ${floorPoint.y.toFixed(3)} m, found ${support.point.y.toFixed(3)} m.` : 'No floor within 1 m below expected walking surface.'});
      }
      ray.set(eyePoint, up); ray.near = 0.005; ray.far = 0.2;
      const ceiling = ray.intersectObjects(meshes, false)[0];
      if (ceiling) addIssue({kind: 'headroom', object: ceiling.object.name, segment: i, point: roundPoint(eyePoint), detail: `Only ${ceiling.distance.toFixed(3)} m clearance above camera eye.`});
    }
    traversed += length;
  }
  routes.push({id, length: Number(total.toFixed(3)), samples, issues});
}
const issueCount = routes.reduce((sum, route) => sum + route.issues.length, 0);
const report = { generatedAt: new Date().toISOString(), model: modelPath, sha256: createHash('sha256').update(bytes).digest('hex'), meshes: meshes.length, method: 'Double-sided exported mesh raycasts; piecewise routes, interpolated eye height, torso and ±0.16m envelope, 0.15m floor/headroom samples. Does not certify arbitrary free movement.', pass: issueCount === 0, issueCount, routes };
mkdirSync('output', {recursive: true});
writeFileSync('output/route-audit.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.pass ? 0 : 1;
