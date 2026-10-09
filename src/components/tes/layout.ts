export type Vec3 = readonly [number, number, number];
export type Run = readonly Vec3[];

export type PartId =
  | "container"
  | "hub-1"
  | "hub-2"
  | "hub-3"
  | "hub-4"
  | "ecr-1"
  | "ecr-2"
  | "ecr-3"
  | "ecr-4"
  | "dffc-1"
  | "dffc-2"
  | "dffc-3"
  | "dffc-4"
  | "trim-process"
  | "battery"
  | "ai-ems"
  | "manifold-process"
  | "electrolyte"
  | "fuel"
  | "trim-storage"
  | "manifold-storage";

export type ShellMode = "open" | "closed" | "xray";
export type Isolate = "all" | "process" | "storage";
export type ViewId = "front" | "back" | "iso" | "door" | "top" | "utility";

export const L = 40;
export const W = 8;
export const H = 8.5;

const HUB_W = 5.35;
const HUB_GAP = 0.36;
const HUB_LEFT = -18.7;

export const HUBS = [0, 1, 2, 3].map((i) => {
  const x = HUB_LEFT + HUB_W / 2 + i * (HUB_W + HUB_GAP);
  return { n: (i + 1) as 1 | 2 | 3 | 4, x, width: HUB_W };
});

export const PROCESS_Z = 1.02;
export const TRIM_P = { x: 7.05, y: 4.15, z: PROCESS_Z, r: 0.92, h: 4.85 };
export const BATTERY = { x: 10.95, y: 3.35, z: PROCESS_Z, size: [2.4, 4.5, 1.58] as Vec3 };
export const AI = { x: 15.15, y: 3.9, z: 0.95, size: [2.85, 6.7, 1.5] as Vec3 };

export const ELEC = { x: -5.15, y: 5.58, z: -1.42, size: [24.6, 2.22, 2.05] as Vec3 };
export const FUEL = { x: -5.15, y: 2.12, z: -1.42, size: [24.6, 2.02, 2.05] as Vec3 };
export const TRIM_S = { x: 12.15, y: 3.55, z: -1.85, r: 0.7, h: 3.25 };

export type Shot = { pos: Vec3; target: Vec3 };

export const VIEWS: Record<ViewId, Shot> = {
  front: { pos: [8, 6.4, 40], target: [0, 4.15, 0.2] },
  back: { pos: [8, 6.6, -40], target: [-0.6, 3.9, -0.25] },
  iso: { pos: [32, 16, 30], target: [0, 3.6, 0] },
  door: { pos: [-40, 7, 12], target: [-4, 4.1, 0] },
  top: { pos: [0.2, 52, 0.3], target: [0, 0, 0] },
  utility: { pos: [22, 8, 14], target: [12, 3.8, 0.4] },
};

export const VIEW_LIST: { id: ViewId; label: string }[] = [
  { id: "front", label: "Front" },
  { id: "back", label: "Back" },
  { id: "iso", label: "Isometric" },
  { id: "door", label: "End" },
  { id: "utility", label: "Utility" },
  { id: "top", label: "Top" },
];

type PartInfo = {
  id: PartId;
  name: string;
  wall: "Envelope" | "Process wall" | "Storage wall";
  summary: string;
  focus: Shot;
};

function hubPart(n: 1 | 2 | 3 | 4, x: number): PartInfo[] {
  return [
    {
      id: `hub-${n}`,
      name: `Hub ${n}`,
      wall: "Process wall",
      summary: "Process bay on a stainless skid. Upper ECR module, lower DFFC module, valve drops, and a hub nameplate.",
      focus: { pos: [x + 0.4, 5.2, 12.5], target: [x, 4.3, PROCESS_Z] },
    },
    {
      id: `ecr-${n}`,
      name: `ECR · Hub ${n}`,
      wall: "Process wall",
      summary: "Upper module in the hub, labeled ECR on the concept. Tied into the orange and blue headers above the bay.",
      focus: { pos: [x + 0.2, 6.2, 11], target: [x, 5.2, PROCESS_Z] },
    },
    {
      id: `dffc-${n}`,
      name: `DFFC · Hub ${n}`,
      wall: "Process wall",
      summary: "Lower module in the hub, labeled DFFC on the concept. Sits on the skid under the ECR with its own nozzle drops.",
      focus: { pos: [x + 0.2, 3.2, 11], target: [x, 2.35, PROCESS_Z] },
    },
  ];
}

export const PARTS: Record<PartId, PartInfo> = {
  container: {
    id: "container",
    name: "40 ft container",
    wall: "Envelope",
    summary: "Standard 40-foot shipping container envelope, 8 ft wide by 8 ft 6 in high. Ends carry the TES mark. Long walls open for the cutaway.",
    focus: VIEWS.iso,
  },
  ...Object.fromEntries(HUBS.flatMap((h) => hubPart(h.n, h.x).map((p) => [p.id, p]))),
  "trim-process": {
    id: "trim-process",
    name: "Trim reservoir",
    wall: "Process wall",
    summary: "Vertical trim vessel downstream of the four hubs, on legs, with a domed head. Matches the process-wall concept.",
    focus: { pos: [TRIM_P.x + 2, 5.5, 12], target: [TRIM_P.x, TRIM_P.y, TRIM_P.z] },
  },
  battery: {
    id: "battery",
    name: "Battery",
    wall: "Process wall",
    summary: "Battery cabinet between the process trim reservoir and the AI/EMS rack.",
    focus: { pos: [BATTERY.x + 1, 5, 12], target: [BATTERY.x, BATTERY.y, BATTERY.z] },
  },
  "ai-ems": {
    id: "ai-ems",
    name: "AI/EMS",
    wall: "Process wall",
    summary: "Controls cabinet at the outlet end of the process wall. HMI in the upper door, louvers below, labeled AI/EMS.",
    focus: { pos: [AI.x + 1.2, 5.2, 12], target: [AI.x, AI.y, AI.z] },
  },
  "manifold-process": {
    id: "manifold-process",
    name: "Water outlet manifold",
    wall: "Process wall",
    summary: "Gravity-flow collection header along the process floor. The concept labels the discharge “To External Collection.”",
    focus: { pos: [12, 3.2, 10], target: [14, 0.95, 2.65] },
  },
  electrolyte: {
    id: "electrolyte",
    name: "Electrolyte storage tank",
    wall: "Storage wall",
    summary: "Long upper vessel on the storage wall, broken into bays the way the concept drawing shows it.",
    focus: { pos: [ELEC.x, 6.4, -14], target: [ELEC.x, ELEC.y, ELEC.z] },
  },
  fuel: {
    id: "fuel",
    name: "Fuel storage tank",
    wall: "Storage wall",
    summary: "Long lower vessel under the electrolyte tank, same bay rhythm, with orange lines running across the face.",
    focus: { pos: [FUEL.x, 3.4, -14], target: [FUEL.x, FUEL.y, FUEL.z] },
  },
  "trim-storage": {
    id: "trim-storage",
    name: "Trim reservoir",
    wall: "Storage wall",
    summary: "Vertical trim vessel in the storage-wall outlet cluster, beside the tank run and ahead of the discharge flange.",
    focus: { pos: [TRIM_S.x + 2, 4.6, -11], target: [TRIM_S.x, TRIM_S.y, TRIM_S.z] },
  },
  "manifold-storage": {
    id: "manifold-storage",
    name: "Water outlet manifold",
    wall: "Storage wall",
    summary: "Storage-side outlet header leaving through the container end, labeled on the concept as the water outlet manifold.",
    focus: { pos: [14, 3, -11], target: [15, 0.95, -2.7] },
  },
} as unknown as Record<PartId, PartInfo>;

export const PART_ORDER: PartId[] = [
  "container",
  "hub-1",
  "ecr-1",
  "dffc-1",
  "hub-2",
  "ecr-2",
  "dffc-2",
  "hub-3",
  "ecr-3",
  "dffc-3",
  "hub-4",
  "ecr-4",
  "dffc-4",
  "trim-process",
  "battery",
  "ai-ems",
  "manifold-process",
  "electrolyte",
  "fuel",
  "trim-storage",
  "manifold-storage",
];

function header(y: number, z: number, x0: number, x1: number): Run {
  return [
    [x0, y, z],
    [x1, y, z],
  ];
}

function drop(x: number, y0: number, z0: number, y1: number, z1: number): Run {
  return [
    [x, y0, z0],
    [x, y1, z0],
    [x, y1, z1],
  ];
}

const hubXs = HUBS.map((h) => h.x);
const bayXs = [-14.2, -6.9, 0.4];

export const ORANGE_PROCESS: Run[] = [
  header(7.48, 2.42, -18.2, 4.5),
  header(6.42, 2.68, -18.2, 5.1),
  ...hubXs.flatMap((x) => [
    drop(x - 0.85, 7.48, 2.42, 6.2, 1.82),
    drop(x + 0.72, 7.48, 2.42, 3.35, 1.82),
    drop(x + 0.05, 6.42, 2.68, 5.15, 1.88),
  ]),
  [
    [4.5, 7.48, 2.42],
    [TRIM_P.x, 7.48, 2.42],
    [TRIM_P.x, 7.48, TRIM_P.z],
    [TRIM_P.x, TRIM_P.y + TRIM_P.h / 2 + 0.05, TRIM_P.z],
  ],
  [
    [TRIM_P.x + 1.15, 6.42, 2.68],
    [TRIM_P.x + 1.15, 4.6, 2.68],
    [TRIM_P.x + 0.95, 4.6, TRIM_P.z + 0.15],
  ],
];

export const ORANGE_STORAGE: Run[] = [
  header(7.22, -2.62, -17.5, 8.4),
  header(6.18, -2.95, -17.3, 6.9),
  header(3.78, -3.02, -17.3, 7.4),
  header(2.48, -3.12, -17.3, 6.9),
  header(1.55, -2.82, -17.1, 6.2),
  ...bayXs.map(
    (x): Run => [
      [x, 6.18, -2.95],
      [x, 2.48, -3.12],
    ],
  ),
  [
    [7.4, 3.78, -3.02],
    [TRIM_S.x, 3.78, -3.02],
    [TRIM_S.x, 3.78, TRIM_S.z],
    [TRIM_S.x, TRIM_S.y + TRIM_S.h / 2, TRIM_S.z],
  ],
  [
    [6.9, 6.18, -2.95],
    [9.4, 6.18, -2.95],
    [9.4, 5.1, TRIM_S.z - 0.15],
    [TRIM_S.x, 5.1, TRIM_S.z - 0.15],
  ],
];

export const BLUE_PROCESS: Run[] = [
  header(6.92, 3.12, -18.2, 17.4),
  header(5.72, 2.88, -18.2, 14.2),
  ...hubXs.flatMap((x) => [
    drop(x + 0.22, 6.92, 3.12, 5.05, 1.9),
    drop(x - 0.28, 6.92, 3.12, 2.15, 1.9),
  ]),
  [
    [17.15, 6.92, 3.12],
    [17.15, 0.95, 3.12],
    [17.15, 0.95, 2.55],
  ],
  drop(BATTERY.x, 5.72, 2.88, 4.4, BATTERY.z + 0.2),
  drop(AI.x - 0.4, 6.92, 3.12, 5.6, AI.z + 0.15),
];

export const BLUE_STORAGE: Run[] = [
  header(4.95, -3.2, -17.3, 9.2),
  header(3.15, -2.72, -17.2, 8.6),
  header(1.15, -3.05, -16.6, 7.8),
  [
    [9.2, 4.95, -3.2],
    [9.2, 0.92, -3.2],
    [14.5, 0.92, -3.05],
  ],
  [
    [TRIM_S.x, 4.3, TRIM_S.z - 0.55],
    [TRIM_S.x, 1.15, TRIM_S.z - 0.55],
    [TRIM_S.x, 1.15, -2.9],
  ],
];

export const STEEL_PROCESS: Run[] = [
  header(0.95, 2.72, 5.4, 19.55),
];

export const STEEL_STORAGE: Run[] = [
  header(0.92, -2.95, 7.6, 19.55),
];
