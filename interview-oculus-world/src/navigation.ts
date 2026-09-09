import { PerspectiveCamera } from 'three';
import type { Point3, WorldLayout } from './layout';
import { diagonalScale, nextLateral } from './movement';

type Paths = Record<string, Point3[]>;
interface RouteLeg { from: string; to: string; points: Point3[]; length: number; startEye: number; endEye: number }
export interface NavigationSnapshot { currentId: string; previousId: string; legs: RouteLeg[]; distance: number; automatic: boolean; yaw: number; pitch: number; position: Point3 }
const segmentLength = (a: Point3, b: Point3) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
export function pathLength(points: Point3[]) { let total = 0; for (let i = 1; i < points.length; i++) total += segmentLength(points[i - 1], points[i]); return total; }

/** Dijkstra on named walkable links; routes never cross directly through rooms. */
export function shortestRoute(paths: Paths, from: string, to: string): string[] {
  if (from === to) return [from];
  const distances = new Map<string, number>([[from, 0]]), previous = new Map<string, string>(), visited = new Set<string>();
  const vertices = new Set(Object.keys(paths).flatMap(key => key.split('-')));
  while (visited.size < vertices.size) {
    let current = '', best = Infinity;
    for (const vertex of vertices) { const distance = distances.get(vertex) ?? Infinity; if (!visited.has(vertex) && distance < best) { current = vertex; best = distance; } }
    if (!current) return [];
    if (current === to) { const route = [to]; while (route[0] !== from) route.unshift(previous.get(route[0])!); return route; }
    visited.add(current);
    for (const [key, points] of Object.entries(paths)) {
      const [a, b] = key.split('-'); const next = a === current ? b : b === current ? a : '';
      if (!next || visited.has(next)) continue;
      const distance = best + pathLength(points);
      if (distance < (distances.get(next) ?? Infinity)) { distances.set(next, distance); previous.set(next, current); }
    }
  }
  return [];
}

/** Linear sampling preserves the exported walkable polygonal route. */
export function sampleRoute(points: Point3[], distance: number, output: Point3): number {
  let remaining = Math.max(0, distance);
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], length = segmentLength(a, b);
    if (remaining <= length || i === points.length - 1) {
      const t = length > 0 ? Math.min(1, remaining / length) : 0;
      output[0] = a[0] + (b[0] - a[0]) * t; output[1] = a[1] + (b[1] - a[1]) * t; output[2] = a[2] + (b[2] - a[2]) * t;
      return i;
    }
    remaining -= length;
  }
  if (points[0]) { output[0] = points[0][0]; output[1] = points[0][1]; output[2] = points[0][2]; }
  return 0;
}

export function createNavigation(camera: PerspectiveCamera, canvas: HTMLCanvasElement, layout: WorldLayout, onLocation: (id: string) => void) {
  let enabled = true, dragging = false, pointer = -1, lastX = 0, lastY = 0, yaw = 0, pitch = 0;
  let currentId = 'entry', previousId = '', legs: RouteLeg[] = [], distance = 0, automatic = false, lookCooldown = 0;
  let forward = false, backward = false, left = false, right = false, lateral = 0, fadeTime = -1, pendingDestination: string | null = null;
  const sample: Point3 = [0, 0, 0];
  const controls = document.createElement('section'); controls.className = 'journey-controls'; controls.setAttribute('aria-label', '沿馆内路线探索');
  const branchContainer = document.createElement('div'); branchContainer.className = 'journey-branches';
  const moveContainer = document.createElement('div'); moveContainer.className = 'journey-movement';
  const backButton = document.createElement('button'); backButton.textContent = '↓ 后退'; backButton.type = 'button'; backButton.setAttribute('aria-label', '按住沿路线后退');
  const forwardButton = document.createElement('button'); forwardButton.textContent = '前进 ↑'; forwardButton.type = 'button'; forwardButton.setAttribute('aria-label', '按住沿路线前进');
  const stopButton = document.createElement('button'); stopButton.textContent = '暂停行走'; stopButton.type = 'button'; stopButton.hidden = true;
  const status = document.createElement('span'); status.className = 'journey-status'; status.setAttribute('aria-live', 'polite');
  moveContainer.append(backButton, forwardButton, stopButton); controls.append(branchContainer, moveContainer, status); document.getElementById('app')?.append(controls);
  const fade = document.createElement('div'); fade.className = 'journey-fade'; document.getElementById('app')?.append(fade);

  const neighbors = (id: string) => Object.keys(layout.paths).flatMap(key => { const [a, b] = key.split('-'); return a === id ? [b] : b === id ? [a] : []; });
  function makeLeg(from: string, to: string): RouteLeg {
    const direct = layout.paths[`${from}-${to}`];
    const points = direct ?? [...layout.paths[`${to}-${from}`]].reverse();
    return { from, to, points, length: pathLength(points), startEye: layout.destinations[from].position[1] - points[0][1], endEye: layout.destinations[to].position[1] - points[points.length - 1][1] };
  }
  function refreshControls() {
    branchContainer.replaceChildren();
    if (!legs.length) {
      for (const id of neighbors(currentId)) {
        const button = document.createElement('button'); button.type = 'button'; button.textContent = `${layout.destinations[id].name} ↗`;
        button.addEventListener('click', () => walkTo(id)); branchContainer.append(button);
      }
    }
    stopButton.hidden = !automatic;
    status.textContent = legs.length ? `沿路前往 · ${layout.destinations[legs[0].to].name}` : '选择方向，沿路探索';
  }
  function lookAtDestination(id: string) {
    const {position, target} = layout.destinations[id]; const dx = target[0] - position[0], dy = target[1] - position[1], dz = target[2] - position[2];
    yaw = Math.atan2(-dx, -dz); pitch = Math.asin(dy / Math.hypot(dx, dy, dz)); camera.position.set(...position); camera.rotation.set(pitch, yaw, 0, 'YXZ');
  }
  function arrive(id: string, from: string) { forward = backward = left = right = false; lateral = 0; previousId = from; currentId = id; onLocation(id); refreshControls(); }
  function navigate(id: string) {
    if (!layout.destinations[id]) return;
    forward = backward = left = right = automatic = false; lateral = 0; dragging = false; pendingDestination = id; fadeTime = 0;
  }
  function walkTo(id: string) {
    if (!enabled || !layout.destinations[id]) return;
    const start = legs.length ? legs[0].to : currentId;
    const route = shortestRoute(layout.paths, start, id);
    if (!route.length) return;
    const next = route.slice(1).map((to, index) => makeLeg(route[index], to));
    if (legs.length) legs = [legs[0], ...next]; else { legs = next; distance = 0; }
    automatic = legs.length > 0; refreshControls();
  }
  function stepStart(reverse: boolean) {
    const choices = neighbors(currentId); const target = reverse ? (choices.includes(previousId) ? previousId : choices[0]) : choices.find(id => id !== previousId) ?? choices[0];
    if (target) { legs = [makeLeg(currentId, target)]; distance = 0; refreshControls(); }
  }
  const onPointerDown = (event: PointerEvent) => {
    if (!enabled || event.button !== 0) return;
    pointer = event.pointerId; lastX = event.clientX; lastY = event.clientY; dragging = false;
  };
  const onPointerMove = (event: PointerEvent) => {
    if (!enabled || pointer !== event.pointerId) return;
    const dx = event.clientX - lastX, dy = event.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) > 1) dragging = true;
    yaw -= dx * 0.003; pitch = Math.max(-1.05, Math.min(1.05, pitch - dy * 0.003)); lastX = event.clientX; lastY = event.clientY; lookCooldown = 3;
  };
  const onPointerUp = () => { pointer = -1; forward = backward = false; /* main can still read dragging in its pointerup handler */ };
  const isTyping = (event: KeyboardEvent) => event.target instanceof HTMLElement && (event.target.matches('input,textarea,select,button,video') || event.target.isContentEditable || !!event.target.closest('[role="dialog"]'));
  const onKeyDown = (event: KeyboardEvent) => {
    if (!enabled || isTyping(event)) return;
    if (event.code === 'KeyW' || event.code === 'ArrowUp') { event.preventDefault(); forward = true; automatic = false; }
    if (event.code === 'KeyS' || event.code === 'ArrowDown') { event.preventDefault(); backward = true; automatic = false; }
    if (event.code === 'KeyA') { event.preventDefault(); left = true; automatic = false; }
    if (event.code === 'KeyD') { event.preventDefault(); right = true; automatic = false; }
  };
  const onKeyUp = (event: KeyboardEvent) => { if (event.code === 'KeyW' || event.code === 'ArrowUp') forward = false; if (event.code === 'KeyS' || event.code === 'ArrowDown') backward = false; if (event.code === 'KeyA') left = false; if (event.code === 'KeyD') right = false; };
  const onBlur = () => { forward = backward = left = right = automatic = false; pointer = -1; refreshControls(); };
  forwardButton.addEventListener('pointerdown', event => { if (!enabled) return; event.preventDefault(); forward = true; backward = automatic = false; });
  backButton.addEventListener('pointerdown', event => { if (!enabled) return; event.preventDefault(); backward = true; forward = automatic = false; });
  // Keyboard activation gives a short, accessible guided journey rather than requiring a held pointer.
  forwardButton.addEventListener('click', event => { if (event.detail === 0 && enabled) { if (!legs.length) stepStart(false); automatic = legs.length > 0; refreshControls(); } });
  backButton.addEventListener('click', event => { if (event.detail === 0 && enabled) {
    if (legs.length) { const leg = legs[0]; legs = [makeLeg(leg.to, leg.from)]; distance = leg.length - distance; }
    else stepStart(true);
    automatic = legs.length > 0; refreshControls();
  } });
  stopButton.addEventListener('click', () => { automatic = false; refreshControls(); });
  canvas.addEventListener('pointerdown', onPointerDown); window.addEventListener('pointermove', onPointerMove); window.addEventListener('pointerup', onPointerUp); window.addEventListener('pointercancel', onPointerUp);
  window.addEventListener('keydown', onKeyDown); window.addEventListener('keyup', onKeyUp); window.addEventListener('blur', onBlur);
  lookAtDestination(currentId); refreshControls();

  return {
    get enabled() { return enabled; },
    set enabled(value: boolean) { enabled = value; controls.inert = !value; controls.classList.toggle('is-disabled', !value); if (!value) { forward = backward = left = right = false; pointer = -1; dragging = false; } },
    get dragging() { return dragging; },
    get currentId() { return currentId; },
    navigate, walkTo,
    save(): NavigationSnapshot { return { currentId, previousId, legs: [...legs], distance, automatic, yaw, pitch, position: [camera.position.x, camera.position.y, camera.position.z] }; },
    restore(saved: NavigationSnapshot) {
      currentId = saved.currentId; previousId = saved.previousId; legs = [...saved.legs]; distance = saved.distance; automatic = saved.automatic; yaw = saved.yaw; pitch = saved.pitch;
      pendingDestination = null; fadeTime = -1; fade.style.opacity = '0'; camera.position.set(...saved.position); camera.rotation.set(pitch, yaw, 0, 'YXZ'); onLocation(currentId); refreshControls();
    },
    update(delta: number) {
      const dt = Math.min(0.08, Math.max(0, delta));
      if (fadeTime >= 0) {
        fadeTime += dt; fade.style.opacity = String(fadeTime < 0.16 ? fadeTime / 0.16 : Math.max(0, 1 - (fadeTime - 0.16) / 0.2));
        if (fadeTime >= 0.16 && pendingDestination) { const old = currentId; currentId = pendingDestination; pendingDestination = null; legs = []; distance = 0; lookAtDestination(currentId); arrive(currentId, old); }
        if (fadeTime >= 0.36) fadeTime = -1;
        return;
      }
      if (!enabled) return;
      if (pointer === -1) dragging = false;
      lookCooldown = Math.max(0, lookCooldown - dt);
      if (!legs.length && (forward || backward || left || right)) stepStart(backward);
      if (legs.length && (automatic || forward || backward || left || right)) {
        const leg = legs[0]; const direction = backward ? -1 : 1;
        if (backward && distance === 0) { const reverse = makeLeg(leg.to, leg.from); legs[0] = reverse; distance = reverse.length; }
        const active = legs[0];
        const walking = forward || backward; const strafing = left || right; const scale = diagonalScale(Number(walking), Number(strafing));
        if (walking || automatic) distance = Math.max(0, Math.min(active.length, distance + dt * 3.4 * direction * (automatic ? 1 : scale)));
        lateral = nextLateral(lateral, (right ? 1 : 0) - (left ? 1 : 0), dt, 2.6 * scale, 1.35);
        const index = sampleRoute(active.points, distance, sample);
        const eye = active.startEye + (active.endEye - active.startEye) * (distance / active.length);
        const tangentIndex = Math.max(1, index); const a = active.points[tangentIndex - 1], b = active.points[tangentIndex]; const dx = b[0] - a[0], dz = b[2] - a[2], horizontalLength = Math.hypot(dx, dz) || 1;
        camera.position.set(sample[0] - dz / horizontalLength * lateral, sample[1] + eye, sample[2] + dx / horizontalLength * lateral);
        if (!dragging && lookCooldown === 0 && index > 0) {
          const targetYaw = Math.atan2(-(b[0] - a[0]), -(b[2] - a[2]));
          const difference = Math.atan2(Math.sin(targetYaw - yaw), Math.cos(targetYaw - yaw)); yaw += difference * Math.min(1, dt * 3);
        }
        if (distance >= active.length && direction > 0) { legs.shift(); distance = 0; if (!legs.length) { automatic = false; lookAtDestination(active.to); } arrive(active.to, active.from); }
        else if (distance <= 0 && direction < 0) { legs = []; automatic = false; arrive(active.from, active.to); }
      }
      camera.rotation.set(pitch, yaw, 0, 'YXZ');
    },
    dispose() {
      canvas.removeEventListener('pointerdown', onPointerDown); window.removeEventListener('pointermove', onPointerMove); window.removeEventListener('pointerup', onPointerUp); window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); window.removeEventListener('blur', onBlur); controls.remove(); fade.remove();
    },
  };
}
