import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Run } from "./layout";
import { FINISH } from "./finishes";

type Seg = {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  len: number;
};

const FLANGE_BASE = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);

export function PipeRuns({
  runs,
  radius,
  finish,
}: {
  runs: readonly Run[];
  radius: number;
  finish: "orange" | "blue" | "steel";
}) {
  const built = useMemo(() => {
    const cyl: Seg[] = [];
    const joints: THREE.Vector3[] = [];
    const flanges: Seg[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3();
    const mid = new THREE.Vector3();
    const end = new THREE.Vector3();
    for (const run of runs) {
      const v = run.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
      for (let i = 0; i < v.length - 1; i++) {
        const a = v[i];
        const b = v[i + 1];
        if (!a || !b) continue;
        dir.subVectors(b, a);
        const len = dir.length();
        if (len < 0.04) continue;
        dir.multiplyScalar(1 / len);
        mid.copy(a).addScaledVector(dir, len / 2);
        const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
        cyl.push({ pos: mid.clone(), quat, len });
        if (len > 0.45) {
          const flangeQuat = quat.clone().multiply(FLANGE_BASE);
          end.copy(a).addScaledVector(dir, Math.min(0.08, len * 0.15));
          flanges.push({ pos: end.clone(), quat: flangeQuat, len: 1 });
          end.copy(b).addScaledVector(dir, -Math.min(0.08, len * 0.15));
          flanges.push({ pos: end.clone(), quat: flangeQuat, len: 1 });
        }
      }
      for (const p of v) joints.push(p);
    }
    return { cyl, joints, flanges };
  }, [runs]);

  const material = FINISH[finish];
  const tube = useMemo(() => new THREE.CylinderGeometry(radius, radius, 1, 24, 1), [radius]);
  const elbow = useMemo(() => new THREE.SphereGeometry(radius * 0.98, 16, 12), [radius]);
  const flange = useMemo(() => new THREE.TorusGeometry(radius * 1.22, radius * 0.2, 8, 18), [radius]);
  const tubes = useRef<THREE.InstancedMesh>(null);
  const joints = useRef<THREE.InstancedMesh>(null);
  const rings = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = tubes.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const s = new THREE.Vector3(1, 1, 1);
    built.cyl.forEach((seg, i) => {
      s.set(1, seg.len, 1);
      m.compose(seg.pos, seg.quat, s);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = true;
  }, [built]);

  useLayoutEffect(() => {
    const mesh = joints.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    built.joints.forEach((p, i) => {
      m.makeTranslation(p.x, p.y, p.z);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [built]);

  useLayoutEffect(() => {
    const mesh = rings.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const s = new THREE.Vector3(1, 1, 1);
    built.flanges.forEach((seg, i) => {
      m.compose(seg.pos, seg.quat, s);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [built]);

  if (built.cyl.length === 0) return null;

  return (
    <group>
      <instancedMesh ref={tubes} args={[tube, material, built.cyl.length]} frustumCulled={false} castShadow />
      {built.joints.length > 0 && (
        <instancedMesh ref={joints} args={[elbow, material, built.joints.length]} frustumCulled={false} castShadow />
      )}
      {built.flanges.length > 0 && (
        <instancedMesh ref={rings} args={[flange, FINISH.steel, built.flanges.length]} frustumCulled={false} />
      )}
    </group>
  );
}