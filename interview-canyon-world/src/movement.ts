export function movementAxes(keys: ReadonlySet<string>) {
  const forward = Number(keys.has('KeyW') || keys.has('ArrowUp')) - Number(keys.has('KeyS') || keys.has('ArrowDown'));
  const strafe = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
  return {forward, strafe};
}

export function diagonalScale(forward: number, strafe: number) {
  return forward !== 0 && strafe !== 0 ? Math.SQRT1_2 : 1;
}

export function nextLateral(current: number, strafe: number, delta: number, speed: number, limit: number) {
  return Math.max(-limit, Math.min(limit, current + strafe * delta * speed));
}
