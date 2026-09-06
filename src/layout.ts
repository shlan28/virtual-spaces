/** Blender 与网页共享 Y-up 世界坐标，避免展位和道路各自漂移。 */
export type Point3 = [number, number, number];
export interface WorldLayout {
 route: Point3[];
 platforms: {interview: Point3; summit: Point3};
 mirror: Point3;
}
export async function loadLayout(): Promise<WorldLayout> {
 const response = await fetch('/models/world-layout.json');
 if (!response.ok) throw new Error('峡谷布局加载失败');
 return response.json() as Promise<WorldLayout>;
}
