import { useMemo, useState, type ReactNode } from "react";
import { Html, RoundedBox, useCursor } from "@react-three/drei";
import { PALETTE } from "./palette";
import { FINISH } from "./finishes";
import { arrowPlate, hmiTexture, plate } from "./textures";
import { PipeRuns } from "./pipes";
import {
  AI,
  BATTERY,
  BLUE_PROCESS,
  BLUE_STORAGE,
  ELEC,
  FUEL,
  HUBS,
  ORANGE_PROCESS,
  ORANGE_STORAGE,
  PARTS,
  PROCESS_Z,
  TRIM_P,
  TRIM_S,
  type PartId,
} from "./layout";

function Selectable({
  id,
  selected,
  onSelect,
  callouts,
  halo,
  children,
}: {
  id: PartId;
  selected: PartId | null;
  onSelect: (id: PartId) => void;
  callouts: boolean;
  halo: readonly [number, number, number, number, number, number];
  children: ReactNode;
}) {
  const [hot, setHot] = useState(false);
  useCursor(hot);
  const active = selected === id;
  const showTag = active || callouts;
  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHot(true);
      }}
      onPointerOut={() => setHot(false)}
    >
      {children}
      {active && (
        <mesh position={[halo[0], halo[1], halo[2]]}>
          <boxGeometry args={[halo[3], halo[4], halo[5]]} />
          <meshBasicMaterial color={PALETTE.tes} transparent opacity={0.14} depthWrite={false} />
        </mesh>
      )}
      {showTag && (
        <Html
          position={[halo[0], halo[1] + halo[4] / 2 + 0.28, halo[2]]}
          center
          distanceFactor={26}
          zIndexRange={[30, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div
            className={
              active
                ? "whitespace-nowrap rounded-md bg-primary px-2 py-1 font-display text-sm tracking-wide text-primary-fg"
                : "whitespace-nowrap rounded-md bg-surface px-2 py-1 font-display text-sm tracking-wide text-primary"
            }
          >
            {PARTS[id].name}
          </div>
        </Html>
      )}
    </group>
  );
}

function Steel() {
  return <primitive object={FINISH.steel} attach="material" />;
}

function Handwheel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <torusGeometry args={[0.15, 0.026, 8, 16]} />
        <primitive object={FINISH.blue} attach="material" />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.032, 0.032, 0.07, 8]} />
        <primitive object={FINISH.steel} attach="material" />
      </mesh>
    </group>
  );
}

function Hub({
  n,
  x,
  width,
  selected,
  onSelect,
  callouts,
}: {
  n: 1 | 2 | 3 | 4;
  x: number;
  width: number;
  selected: PartId | null;
  onSelect: (id: PartId) => void;
  callouts: boolean;
}) {
  const ecrMap = useMemo(() => plate("ECR", PALETTE.ecr, PALETTE.tes), []);
  const dffcMap = useMemo(() => plate("DFFC", PALETTE.dffc, PALETTE.paper), []);
  const hubMap = useMemo(() => plate(`HUB ${n}`, PALETTE.ink, PALETTE.paper), [n]);
  const half = width / 2 - 0.22;
  const posts: [number, number][] = [
    [-half, 0.78],
    [half, 0.78],
    [-half, -0.7],
    [half, -0.7],
  ];
  const boxW = width * 0.6;
  return (
    <group position={[x, 0, PROCESS_Z]}>
      <Selectable
        id={`hub-${n}`}
        selected={selected}
        onSelect={onSelect}
        callouts={callouts}
        halo={[0, 3.85, 0.05, width - 0.15, 7.2, 2.3]}
      >
        {posts.map(([px, pz], i) => (
          <mesh key={i} position={[px, 3.7, pz]} castShadow>
            <boxGeometry args={[0.1, 6.85, 0.1]} />
            <Steel />
          </mesh>
        ))}
        {[7.05, 4.35, 0.72].map((y) => (
          <mesh key={y} position={[0, y, 0.78]} castShadow>
            <boxGeometry args={[width - 0.35, 0.1, 0.1]} />
            <Steel />
          </mesh>
        ))}
        <mesh position={[0, 0.38, 0.05]} castShadow>
          <boxGeometry args={[width - 0.45, 0.14, 1.85]} />
          <primitive object={FINISH.steelDark} attach="material" />
        </mesh>
        <mesh position={[0, 7.22, 0.95]}>
          <boxGeometry args={[width * 0.46, 0.42, 0.06]} />
          <meshPhysicalMaterial map={hubMap} roughness={0.4} metalness={0.28} clearcoat={0.2} clearcoatRoughness={0.35} envMapIntensity={0.7} />
        </mesh>
        {[-half * 0.72, half * 0.72].map((px) => (
          <mesh key={px} position={[px, 3.85, 1.02]} castShadow>
            <cylinderGeometry args={[0.055, 0.055, 5.4, 10]} />
            <Steel />
          </mesh>
        ))}
        <Handwheel position={[-half * 0.72, 4.85, 1.22]} />
        <Handwheel position={[half * 0.72, 2.55, 1.22]} />
        <Selectable
          id={`ecr-${n}`}
          selected={selected}
          onSelect={onSelect}
          callouts={false}
          halo={[0, 5.35, 0.05, boxW + 0.15, 1.85, 1.45]}
        >
          <RoundedBox args={[boxW, 1.72, 1.28]} radius={0.04} smoothness={2} position={[0, 5.35, 0.12]} castShadow>
          <primitive object={FINISH.cabinet} attach="material" />
          </RoundedBox>
          <mesh position={[0, 5.35, 0.78]}>
            <planeGeometry args={[boxW * 0.72, 0.62]} />
            <meshPhysicalMaterial map={ecrMap} roughness={0.42} metalness={0.22} clearcoat={0.25} clearcoatRoughness={0.3} envMapIntensity={0.65} />
          </mesh>
        </Selectable>
        <Selectable
          id={`dffc-${n}`}
          selected={selected}
          onSelect={onSelect}
          callouts={false}
          halo={[0, 2.55, 0.05, boxW + 0.15, 1.9, 1.45]}
        >
          <RoundedBox args={[boxW, 1.78, 1.28]} radius={0.04} smoothness={2} position={[0, 2.55, 0.12]} castShadow>
            <primitive object={FINISH.powder} attach="material" />
          </RoundedBox>
          <mesh position={[0, 2.55, 0.78]}>
            <planeGeometry args={[boxW * 0.72, 0.62]} />
            <meshPhysicalMaterial map={dffcMap} roughness={0.4} metalness={0.3} clearcoat={0.18} clearcoatRoughness={0.3} envMapIntensity={0.7} />
          </mesh>
        </Selectable>
      </Selectable>
    </group>
  );
}

function TrimVessel({
  id,
  x,
  y,
  z,
  r,
  h,
  face,
  selected,
  onSelect,
  callouts,
}: {
  id: PartId;
  x: number;
  y: number;
  z: number;
  r: number;
  h: number;
  face: 1 | -1;
  selected: PartId | null;
  onSelect: (id: PartId) => void;
  callouts: boolean;
}) {
  const map = useMemo(() => plate("Trim Reservoir", PALETTE.steel, PALETTE.tes), []);
  return (
    <group position={[x, y, z]}>
      <Selectable
        id={id}
        selected={selected}
        onSelect={onSelect}
        callouts={callouts}
        halo={[0, 0.15, 0, r * 2.3, h + 0.9, r * 2.3]}
      >
        <mesh castShadow>
          <cylinderGeometry args={[r, r * 0.98, h, 28]} />
          <Steel />
        </mesh>
        <mesh position={[0, h / 2, 0]} castShadow>
          <sphereGeometry args={[r * 0.98, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Steel />
        </mesh>
        {[0, 2.1, 4.2].map((a) => {
          const ang = (a * Math.PI) / 3;
          return (
            <mesh key={a} position={[Math.cos(ang) * r * 0.72, -h / 2 - 0.28, Math.sin(ang) * r * 0.72]}>
              <cylinderGeometry args={[0.06, 0.08, 0.7, 8]} />
              <primitive object={FINISH.steelDark} attach="material" />
            </mesh>
          );
        })}
        <mesh position={[0, -h * 0.05, face * (r + 0.03)]} rotation={[0, face === -1 ? Math.PI : 0, 0]}>
          <planeGeometry args={[r * 1.7, h * 0.28]} />
          <meshPhysicalMaterial map={map} metalness={0.35} roughness={0.38} clearcoat={0.2} clearcoatRoughness={0.3} envMapIntensity={0.75} />
        </mesh>
        <mesh position={[r * 0.92, 0, 0]}>
          <boxGeometry args={[0.04, h * 0.55, 0.08]} />
          <meshStandardMaterial color={PALETTE.blue} transparent opacity={0.55} metalness={0.1} roughness={0.15} />
        </mesh>
      </Selectable>
    </group>
  );
}

function StorageTank({
  id,
  label,
  position,
  size,
  selected,
  onSelect,
  callouts,
}: {
  id: PartId;
  label: string;
  position: [number, number, number];
  size: readonly [number, number, number];
  selected: PartId | null;
  onSelect: (id: PartId) => void;
  callouts: boolean;
}) {
  const map = useMemo(() => plate(label, PALETTE.ecr, PALETTE.tes), [label]);
  const [sx, sy, sz] = size;
  return (
    <group position={position}>
      <Selectable
        id={id}
        selected={selected}
        onSelect={onSelect}
        callouts={callouts}
        halo={[0, 0, 0, sx + 0.2, sy + 0.2, sz + 0.25]}
      >
        <RoundedBox args={[sx, sy, sz]} radius={0.04} smoothness={2} castShadow receiveShadow>
          <primitive object={FINISH.cabinet} attach="material" />
        </RoundedBox>
        {[-sx / 6, sx / 6].map((px) => (
          <mesh key={px} position={[px, 0, -(sz / 2 + 0.02)]} castShadow>
            <boxGeometry args={[0.16, sy * 0.98, 0.08]} />
            <primitive object={FINISH.steel} attach="material" />
          </mesh>
        ))}
        {[-sx / 2 + 0.08, sx / 2 - 0.08].map((px) => (
          <mesh key={`end-${px}`} position={[px, 0, -(sz / 2 + 0.015)]}>
            <boxGeometry args={[0.08, sy, 0.05]} />
            <primitive object={FINISH.steelDark} attach="material" />
          </mesh>
        ))}
        <mesh position={[0, 0, -(sz / 2 + 0.04)]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[Math.min(sx * 0.7, 13.5), sy * 0.46]} />
          <meshPhysicalMaterial map={map} metalness={0.22} roughness={0.4} clearcoat={0.3} clearcoatRoughness={0.32} envMapIntensity={0.7} />
        </mesh>
        <mesh position={[0, sy / 2 + 0.05, 0]}>
          <boxGeometry args={[sx, 0.08, 0.1]} />
          <primitive object={FINISH.steel} attach="material" />
        </mesh>
      </Selectable>
    </group>
  );
}

function Manifold({
  id,
  y,
  z,
  x0,
  x1,
  face,
  selected,
  onSelect,
  callouts,
}: {
  id: PartId;
  y: number;
  z: number;
  x0: number;
  x1: number;
  face: 1 | -1;
  selected: PartId | null;
  onSelect: (id: PartId) => void;
  callouts: boolean;
}) {
  const map = useMemo(() => arrowPlate(), []);
  const len = x1 - x0;
  const mid = (x0 + x1) / 2;
  return (
    <group position={[mid, y, z]}>
      <Selectable
        id={id}
        selected={selected}
        onSelect={onSelect}
        callouts={callouts}
        halo={[0, 0.35, 0, len, 0.9, 0.9]}
      >
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.16, 0.16, len, 16]} />
          <Steel />
        </mesh>
        {Array.from({ length: Math.max(5, Math.round(len / 1.7)) }, (_, i) => {
          const count = Math.max(5, Math.round(len / 1.7));
          const x = -len / 2 + 0.7 + ((len - 1.8) * i) / Math.max(count - 1, 1);
          return (
            <group key={i} position={[x, 0.34, face * 0.02]}>
              <mesh>
                <cylinderGeometry args={[0.07, 0.07, 0.22, 8]} />
                <primitive object={FINISH.blue} attach="material" />
              </mesh>
              <Handwheel position={[0, 0.16, 0]} />
            </group>
          );
        })}
        {Array.from({ length: 4 }, (_, i) => {
          const x = -len / 2 + ((i + 1) * len) / 5;
          return (
            <mesh key={`leg-${i}`} position={[x, -0.42, 0]}>
              <cylinderGeometry args={[0.035, 0.045, 0.78, 8]} />
              <primitive object={FINISH.steelDark} attach="material" />
            </mesh>
          );
        })}
        <mesh position={[len / 2 - 0.02, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.34, 0.045, 8, 18]} />
          <Steel />
        </mesh>
        <mesh position={[len / 2 + 0.22, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.16, 0.36, 12]} />
          <primitive object={FINISH.blue} attach="material" />
        </mesh>
        <mesh
          position={[len * 0.12, 0.55, face * 0.02]}
          rotation={[face === -1 ? 0.4 : -0.4, face === -1 ? Math.PI : 0, 0]}
        >
          <planeGeometry args={[3.4, 0.85]} />
          <meshPhysicalMaterial map={map} roughness={0.45} metalness={0.15} clearcoat={0.12} envMapIntensity={0.5} />
        </mesh>
      </Selectable>
    </group>
  );
}

export function ProcessWall({
  selected,
  onSelect,
  callouts,
}: {
  selected: PartId | null;
  onSelect: (id: PartId) => void;
  callouts: boolean;
}) {
  const screen = useMemo(() => hmiTexture(), []);
  const bat = useMemo(() => plate("Battery", PALETTE.paint, PALETTE.tes), []);
  const ai = useMemo(() => plate("AI/EMS", PALETTE.paint, PALETTE.tes), []);
  return (
    <group>
      {HUBS.map((h) => (
        <Hub key={h.n} n={h.n} x={h.x} width={h.width} selected={selected} onSelect={onSelect} callouts={callouts} />
      ))}
      <TrimVessel
        id="trim-process"
        x={TRIM_P.x}
        y={TRIM_P.y}
        z={TRIM_P.z}
        r={TRIM_P.r}
        h={TRIM_P.h}
        face={1}
        selected={selected}
        onSelect={onSelect}
        callouts={callouts}
      />
      <group position={[BATTERY.x, BATTERY.y, BATTERY.z]}>
        <Selectable
          id="battery"
          selected={selected}
          onSelect={onSelect}
          callouts={callouts}
          halo={[0, 0, 0, BATTERY.size[0] + 0.2, BATTERY.size[1] + 0.2, BATTERY.size[2] + 0.2]}
        >
          <RoundedBox args={[BATTERY.size[0], BATTERY.size[1], BATTERY.size[2]]} radius={0.05} smoothness={2} castShadow>
            <primitive object={FINISH.cabinet} attach="material" />
          </RoundedBox>
          <mesh position={[0, 0.35, BATTERY.size[2] / 2 + 0.02]}>
            <planeGeometry args={[2, 0.7]} />
            <meshPhysicalMaterial map={bat} roughness={0.4} metalness={0.2} clearcoat={0.25} clearcoatRoughness={0.35} envMapIntensity={0.65} />
          </mesh>
          {[ -0.7, 0, 0.7].map((y) => (
            <mesh key={y} position={[0, y - 1.15, BATTERY.size[2] / 2 + 0.02]}>
              <boxGeometry args={[1.8, 0.08, 0.04]} />
              <meshStandardMaterial color={PALETTE.ink} />
            </mesh>
          ))}
        </Selectable>
      </group>
      <group position={[AI.x, AI.y, AI.z]}>
        <Selectable
          id="ai-ems"
          selected={selected}
          onSelect={onSelect}
          callouts={callouts}
          halo={[0, 0, 0, AI.size[0] + 0.18, AI.size[1] + 0.18, AI.size[2] + 0.18]}
        >
          <RoundedBox args={[AI.size[0], AI.size[1], AI.size[2]]} radius={0.05} smoothness={2} castShadow>
            <primitive object={FINISH.cabinet} attach="material" />
          </RoundedBox>
          <mesh position={[0, 1.35, AI.size[2] / 2 + 0.03]}>
            <planeGeometry args={[2.15, 1.55]} />
            <meshStandardMaterial map={screen} emissive={PALETTE.screen} emissiveIntensity={0.35} roughness={0.35} />
          </mesh>
          <mesh position={[0, 2.55, AI.size[2] / 2 + 0.02]}>
            <planeGeometry args={[1.6, 0.42]} />
            <meshPhysicalMaterial map={ai} roughness={0.4} metalness={0.2} clearcoat={0.25} clearcoatRoughness={0.35} envMapIntensity={0.65} />
          </mesh>
          {[-1.7, -1.35, -1.0].map((y) => (
            <mesh key={y} position={[0, y, AI.size[2] / 2 + 0.02]}>
              <boxGeometry args={[2.2, 0.08, 0.04]} />
              <meshStandardMaterial color={PALETTE.ink} />
            </mesh>
          ))}
          <mesh position={[1.15, 2.5, AI.size[2] / 2 + 0.04]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial color={PALETTE.lamp} emissive={PALETTE.lamp} emissiveIntensity={0.6} />
          </mesh>
        </Selectable>
      </group>
      <Manifold
        id="manifold-process"
        y={0.95}
        z={2.55}
        x0={5.6}
        x1={19.55}
        face={1}
        selected={selected}
        onSelect={onSelect}
        callouts={callouts}
      />
      <PipeRuns runs={ORANGE_PROCESS} radius={0.13} finish="orange" />
      <PipeRuns runs={BLUE_PROCESS} radius={0.105} finish="blue" />
    </group>
  );
}

export function StorageWall({
  selected,
  onSelect,
  callouts,
}: {
  selected: PartId | null;
  onSelect: (id: PartId) => void;
  callouts: boolean;
}) {
  return (
    <group>
      <StorageTank
        id="electrolyte"
        label="Electrolyte Storage Tank"
        position={[ELEC.x, ELEC.y, ELEC.z]}
        size={ELEC.size}
        selected={selected}
        onSelect={onSelect}
        callouts={callouts}
      />
      <StorageTank
        id="fuel"
        label="Fuel Storage Tank"
        position={[FUEL.x, FUEL.y, FUEL.z]}
        size={FUEL.size}
        selected={selected}
        onSelect={onSelect}
        callouts={callouts}
      />
      <TrimVessel
        id="trim-storage"
        x={TRIM_S.x}
        y={TRIM_S.y}
        z={TRIM_S.z}
        r={TRIM_S.r}
        h={TRIM_S.h}
        face={-1}
        selected={selected}
        onSelect={onSelect}
        callouts={callouts}
      />
      <Manifold
        id="manifold-storage"
        y={0.92}
        z={-2.95}
        x0={7.8}
        x1={19.55}
        face={-1}
        selected={selected}
        onSelect={onSelect}
        callouts={callouts}
      />
      <PipeRuns runs={ORANGE_STORAGE} radius={0.12} finish="orange" />
      <PipeRuns runs={BLUE_STORAGE} radius={0.095} finish="blue" />
    </group>
  );
}
