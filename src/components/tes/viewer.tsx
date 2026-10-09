import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { FINISH } from "./finishes";
import { ProcessWall, StorageWall } from "./equipment";
import { Shell } from "./shell";
import { VIEWS, type PartId, type ShellMode, type Shot } from "./layout";

type RigControls = {
  target: THREE.Vector3;
  update: () => void;
  autoRotate: boolean;
  addEventListener: (type: string, cb: () => void) => void;
  removeEventListener: (type: string, cb: () => void) => void;
};

function frameShot(camera: THREE.PerspectiveCamera, aspect: number, shot: Shot) {
  const target = new THREE.Vector3(shot.target[0], shot.target[1], shot.target[2]);
  const offset = new THREE.Vector3(shot.pos[0], shot.pos[1], shot.pos[2]).sub(target);
  const authored = offset.length();
  const vFov = (camera.fov * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(aspect, 0.35));
  const limit = Math.min(vFov, hFov);
  const fitted = 24 / Math.sin(Math.max(limit, 0.25) / 2);
  const dist = authored < 24 ? authored : Math.min(fitted * 0.74, 130);
  offset.setLength(Math.max(dist, 12));
  return { pos: target.clone().add(offset), target };
}

function Studio() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.06;
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.78;
    return () => {
      env.dispose();
      pmrem.dispose();
      scene.environment = null;
    };
  }, [gl, scene]);
  return null;
}

function CameraRig({ shot, spin }: { shot: Shot & { n: number }; spin: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const controls = useThree((s) => s.controls) as unknown as RigControls | null;
  const reduce = useRef(false);
  const live = useRef(false);
  const toPos = useRef(new THREE.Vector3());
  const toLook = useRef(new THREE.Vector3());

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (size.width < 2 || size.height < 2) return;
    const framed = frameShot(camera, size.width / size.height, shot);
    toPos.current.copy(framed.pos);
    toLook.current.copy(framed.target);
    if (shot.n === 0 || !controls) {
      camera.position.copy(framed.pos);
      if (controls) {
        controls.target.copy(framed.target);
        controls.update();
      }
      live.current = false;
      return;
    }
    live.current = true;
  }, [shot, controls, camera, size.width, size.height]);

  useEffect(() => {
    if (!controls) return;
    const stop = () => {
      live.current = false;
    };
    controls.addEventListener("start", stop);
    return () => controls.removeEventListener("start", stop);
  }, [controls]);

  useFrame((_, delta) => {
    if (controls) controls.autoRotate = spin && !live.current;
    if (!live.current || !controls) return;
    const d = Math.min(delta, 0.25);
    const k = reduce.current ? 1 : 1 - Math.exp(-9 * d);
    camera.position.lerp(toPos.current, k);
    controls.target.lerp(toLook.current, k);
    controls.update();
    if (camera.position.distanceTo(toPos.current) < 0.08) live.current = false;
  });

  return null;
}

export function TesCanvas({
  shell,
  explode,
  callouts,
  spin,
  showProcess,
  showStorage,
  selected,
  shot,
  onSelect,
}: {
  shell: ShellMode;
  explode: number;
  callouts: boolean;
  spin: boolean;
  showProcess: boolean;
  showStorage: boolean;
  selected: PartId | null;
  shot: Shot & { n: number };
  onSelect: (id: PartId | null) => void;
}) {
  const hideWalls = shell === "open" || explode > 0.04;
  const ghost = shell === "xray" || (shell === "closed" && explode > 0.04);

  return (
    <Canvas
      className="tes-stage h-full w-full"
      shadows
      dpr={[1, 1.7]}
      camera={{ position: [32, 16, 30], fov: 32, near: 0.1, far: 260 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "default",
        preserveDrawingBuffer: true,
        failIfMajorPerformanceCaveat: false,
      }}
      onPointerMissed={() => onSelect(null)}
    >
      <color attach="background" args={["#e7eef3"]} />
      <Studio />
      <hemisphereLight args={["#f7fafc", "#9aabba", 0.28]} />
      <ambientLight intensity={0.12} />
      <directionalLight
        position={[16, 24, 12]}
        intensity={1.85}
        color="#fff4ea"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={2}
        shadow-camera-far={90}
        shadow-camera-left={-32}
        shadow-camera-right={32}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-radius={5}
      />
      <directionalLight position={[-20, 14, -12]} intensity={0.42} color="#d5e4f6" />
      <directionalLight position={[6, 10, 22]} intensity={0.28} color="#ffffff" />
      <pointLight position={[-6, 7.2, 0]} intensity={18} distance={22} decay={2} color="#fff6ec" />
      <pointLight position={[10, 7.2, 0]} intensity={16} distance={22} decay={2} color="#fff6ec" />
      <CameraRig shot={shot} spin={spin} />
      <OrbitControls
        makeDefault
        target={VIEWS.iso.target as unknown as [number, number, number]}
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        minDistance={10}
        maxDistance={150}
        minPolarAngle={0.12}
        maxPolarAngle={Math.PI / 2 + 0.55}
        autoRotateSpeed={0.7}
      />
      <group>
        <Shell hideWalls={hideWalls} ghost={ghost} onSelect={(id) => onSelect(id)} />
        {showProcess && (
          <group position={[0, 0, explode * 3.4]}>
            <ProcessWall selected={selected} onSelect={(id) => onSelect(id)} callouts={callouts} />
          </group>
        )}
        {showStorage && (
          <group position={[0, 0, -explode * 3.4]}>
            <StorageWall selected={selected} onSelect={(id) => onSelect(id)} callouts={callouts} />
          </group>
        )}
      </group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelect(null);
        }}
      >
        <planeGeometry args={[80, 56]} />
        <primitive object={FINISH.floor} attach="material" />
      </mesh>
      <ContactShadows position={[0, 0.01, 0]} opacity={0.42} scale={48} blur={2.2} far={12} resolution={1024} color="#6d7c8a" />
    </Canvas>
  );
}
