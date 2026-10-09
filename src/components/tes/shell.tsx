import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { tesMark } from "./textures";
import { FINISH } from "./finishes";
import type { PartId } from "./layout";

function Ribs({
  count,
  span,
  height,
  along,
  position,
  rotation,
  outward = 0.16,
  material,
}: {
  count: number;
  span: number;
  height: number;
  along: "x" | "z";
  position: [number, number, number];
  rotation?: [number, number, number];
  outward?: number;
  material: THREE.Material;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(
    () => new THREE.BoxGeometry(along === "x" ? 0.2 : 0.42, height, along === "x" ? 0.42 : 0.2),
    [along, height],
  );

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const step = span / count;
    for (let i = 0; i < count; i++) {
      const t = -span / 2 + step * (i + 0.5);
      const x = along === "x" ? t : outward;
      const z = along === "z" ? t : outward;
      m.makeTranslation(x, 0, z);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [along, count, outward, span]);

  return (
    <instancedMesh ref={ref} args={[geo, material, count]} position={position} rotation={rotation} frustumCulled={false} castShadow receiveShadow />
  );
}

function EndCap({
  sign,
  ghost,
  onSelect,
}: {
  sign: 1 | -1;
  ghost: boolean;
  onSelect: (id: PartId) => void;
}) {
  const logo = useMemo(() => tesMark(), []);
  const x = sign * 20;
  const exteriorRot: [number, number, number] = [0, sign === -1 ? -Math.PI / 2 : Math.PI / 2, 0];
  const interiorRot: [number, number, number] = [0, sign === -1 ? Math.PI / 2 : -Math.PI / 2, 0];

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onSelect("container");
      }}
    >
      <mesh position={[x, 4.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.16, 8.5, 8]} />
        <primitive object={ghost ? FINISH.paintDeep : FINISH.paint} attach="material" />
      </mesh>
      <mesh position={[x - sign * 0.12, 5.05, 0]} rotation={interiorRot} scale={[sign === 1 ? -1 : 1, 1, 1]}>
        <planeGeometry args={[5.2, 2.5]} />
        <meshStandardMaterial map={logo} transparent alphaTest={0.05} roughness={0.7} side={2} />
      </mesh>
      <mesh position={[x + sign * 0.2, 5.15, 0]} rotation={exteriorRot} scale={[sign === -1 ? -1 : 1, 1, 1]}>
        <planeGeometry args={[4.4, 2.15]} />
        <meshStandardMaterial map={logo} transparent alphaTest={0.05} roughness={0.7} side={2} />
      </mesh>
    </group>
  );
}

function CornerCastings() {
  const posts: [number, number, number][] = [];
  for (const x of [-19.72, 19.72]) {
    for (const z of [-3.72, 3.72]) {
      posts.push([x, 0.38, z], [x, 8.12, z]);
    }
  }
  return (
    <group>
      {posts.map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <boxGeometry args={[0.62, 0.62, 0.62]} />
          <primitive object={FINISH.cast} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

function Rails() {
  const bars: [number, number, number, number, number, number][] = [
    [0, 8.28, 3.82, 38.8, 0.22, 0.28],
    [0, 8.28, -3.82, 38.8, 0.22, 0.28],
    [0, 0.32, 3.82, 38.8, 0.28, 0.32],
    [0, 0.32, -3.82, 38.8, 0.28, 0.32],
  ];
  return (
    <group>
      {bars.map((b, i) => (
        <mesh key={i} position={[b[0], b[1], b[2]]} castShadow>
          <boxGeometry args={[b[3], b[4], b[5]]} />
          <primitive object={FINISH.paintDeep} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

function Roof({ ghost }: { ghost: boolean }) {
  const opacity = ghost ? 0.18 : 1;
  const ribs = useMemo(() => {
    const m = FINISH.paintDeep.clone();
    m.transparent = ghost;
    m.opacity = opacity;
    m.depthWrite = !ghost;
    return m;
  }, [ghost, opacity]);
  return (
    <group>
      <mesh position={[0, 8.38, 0]} castShadow>
        <boxGeometry args={[39.2, 0.08, 7.65]} />
        <primitive object={ghost ? ribs : FINISH.paint} attach="material" />
      </mesh>
      <CeilingRibs material={ribs} />
      {[-1.35, 1.35].map((z) => (
        <mesh key={z} position={[0, 7.86, z]}>
          <boxGeometry args={[36, 0.04, 0.12]} />
          <meshStandardMaterial color="#f7fbff" emissive="#d7e6ff" emissiveIntensity={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function CeilingRibs({ material }: { material: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.BoxGeometry(38.4, 0.1, 0.16), []);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const count = 16;
    for (let i = 0; i < count; i++) {
      const z = -3.15 + (i * 6.3) / (count - 1);
      m.makeTranslation(0, 8.18, z);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);
  return <instancedMesh ref={ref} args={[geo, material, 16]} receiveShadow />;
}

function LiveWall({ sign, mode }: { sign: 1 | -1; mode: "solid" | "cut" | "ghost" }) {
  const skin = useMemo(() => {
    const m = FINISH.paint.clone();
    m.transparent = true;
    return m;
  }, []);
  const rib = useMemo(() => {
    const m = FINISH.paintDeep.clone();
    m.transparent = true;
    return m;
  }, []);
  const group = useRef<THREE.Group>(null);

  useFrame(({ camera }) => {
    let opacity = 1;
    if (mode === "ghost") opacity = 0.18;
    else if (mode === "cut") {
      const near = sign * camera.position.z;
      opacity = near > 14 ? 0 : near < 2 ? 1 : 1 - (near - 2) / 12;
    }
    if (group.current) group.current.visible = opacity > 0.04;
    skin.opacity = opacity;
    rib.opacity = opacity;
    const write = opacity > 0.92;
    skin.depthWrite = write;
    rib.depthWrite = write;
  });

  return (
    <group ref={group}>
      <mesh position={[0, 4.25, sign * 3.72]} castShadow receiveShadow material={skin}>
        <boxGeometry args={[39.1, 8.15, 0.05]} />
      </mesh>
      <Ribs
        count={52}
        span={38.4}
        height={7.9}
        along="x"
        position={[0, 4.25, sign * 3.72]}
        outward={sign * 0.22}
        material={rib}
      />
    </group>
  );
}

export function Shell({
  hideWalls,
  ghost,
  onSelect,
}: {
  hideWalls: boolean;
  ghost: boolean;
  onSelect: (id: PartId) => void;
}) {
  const showSkin = !hideWalls;
  const mode = ghost ? "ghost" : showSkin ? "solid" : "cut";
  return (
    <group>
      <CornerCastings />
      <Rails />
      <Roof ghost={ghost} />
      <EndCap sign={-1} ghost={false} onSelect={onSelect} />
      <EndCap sign={1} ghost={false} onSelect={onSelect} />
      <mesh
        position={[0, 0.12, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelect("container");
        }}
      >
        <boxGeometry args={[39.4, 0.16, 7.5]} />
        <primitive object={FINISH.steelDark} attach="material" />
      </mesh>
      <LiveWall sign={1} mode={mode} />
      <LiveWall sign={-1} mode={mode} />
    </group>
  );
}
