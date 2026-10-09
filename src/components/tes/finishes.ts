import * as THREE from "three";

function canvasTex(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  color: boolean,
) {
  if (typeof document === "undefined") {
    const tex = new THREE.DataTexture(new Uint8Array([232, 236, 240, 255]), 1, 1);
    tex.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    tex.needsUpdate = true;
    return tex;
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function grain(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);
}

const paintMap = canvasTex(512, 512, (ctx, w, h) => {
  ctx.fillStyle = "#e3e9ee";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(90, 104, 116, 0.18)";
  ctx.lineWidth = 2;
  for (let x = 16; x < w; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  for (let x = 18; x < w; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  grain(ctx, w, h, 10);
}, true);
paintMap.repeat.set(6, 2);

const paintBump = canvasTex(512, 512, (ctx, w, h) => {
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#b4b4b4";
  for (let x = 8; x < w; x += 28) ctx.fillRect(x, 0, 6, h);
  ctx.fillStyle = "#5a5a5a";
  for (let x = 22; x < w; x += 28) ctx.fillRect(x, 0, 3, h);
  grain(ctx, w, h, 18);
}, false);

const steelMap = canvasTex(256, 256, (ctx, w, h) => {
  ctx.fillStyle = "#c5ced6";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 1;
  for (let y = 0; y < h; y += 2) {
    ctx.globalAlpha = 0.25 + (y % 6) * 0.04;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  grain(ctx, w, h, 14);
}, true);
steelMap.repeat.set(2, 4);

const steelRough = canvasTex(256, 256, (ctx, w, h) => {
  ctx.fillStyle = "#6a6a6a";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#9a9a9a";
  for (let y = 0; y < h; y += 3) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  grain(ctx, w, h, 28);
}, false);
steelRough.repeat.set(2, 4);

const orangeMap = canvasTex(128, 256, (ctx, w, h) => {
  ctx.fillStyle = "#c85a1c";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(80, 32, 8, 0.25)";
  for (let y = 0; y < h; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  grain(ctx, w, h, 12);
}, true);

const blueMap = canvasTex(128, 256, (ctx, w, h) => {
  ctx.fillStyle = "#1e5ea8";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(6, 24, 48, 0.28)";
  for (let y = 0; y < h; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  grain(ctx, w, h, 12);
}, true);

const floorMap = canvasTex(512, 512, (ctx, w, h) => {
  const g = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.55);
  g.addColorStop(0, "#f7f9fb");
  g.addColorStop(0.7, "#e7eef3");
  g.addColorStop(1, "#e8eef3");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, 6);
}, true);

function physical(params: THREE.MeshPhysicalMaterialParameters) {
  return new THREE.MeshPhysicalMaterial(params);
}

export const FINISH = {
  paint: physical({
    map: paintMap,
    bumpMap: paintBump,
    bumpScale: 0.035,
    color: "#e7edf1",
    metalness: 0.42,
    roughness: 0.46,
    clearcoat: 0.28,
    clearcoatRoughness: 0.42,
    envMapIntensity: 0.85,
  }),
  paintDeep: physical({
    map: paintMap,
    bumpMap: paintBump,
    bumpScale: 0.05,
    color: "#c5cfd6",
    metalness: 0.48,
    roughness: 0.4,
    clearcoat: 0.2,
    clearcoatRoughness: 0.4,
    envMapIntensity: 0.9,
  }),
  steel: physical({
    map: steelMap,
    roughnessMap: steelRough,
    color: "#d5dde3",
    metalness: 0.94,
    roughness: 0.26,
    clearcoat: 0.12,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.35,
  }),
  steelDark: physical({
    map: steelMap,
    roughnessMap: steelRough,
    color: "#8e9aa4",
    metalness: 0.88,
    roughness: 0.32,
    envMapIntensity: 1.15,
  }),
  orange: physical({
    map: orangeMap,
    color: "#d26522",
    metalness: 0.22,
    roughness: 0.34,
    clearcoat: 0.55,
    clearcoatRoughness: 0.24,
    envMapIntensity: 0.95,
  }),
  blue: physical({
    map: blueMap,
    color: "#1f63b0",
    metalness: 0.2,
    roughness: 0.36,
    clearcoat: 0.5,
    clearcoatRoughness: 0.26,
    envMapIntensity: 0.9,
  }),
  cabinet: physical({
    map: paintMap,
    color: "#eef2f5",
    metalness: 0.34,
    roughness: 0.42,
    clearcoat: 0.34,
    clearcoatRoughness: 0.35,
    envMapIntensity: 0.8,
  }),
  powder: physical({
    color: "#2c333b",
    metalness: 0.55,
    roughness: 0.38,
    clearcoat: 0.22,
    clearcoatRoughness: 0.32,
    envMapIntensity: 0.95,
  }),
  cast: physical({
    color: "#3a424a",
    metalness: 0.72,
    roughness: 0.34,
    envMapIntensity: 1,
  }),
  floor: physical({
    map: floorMap,
    color: "#f4f7fa",
    metalness: 0.08,
    roughness: 0.42,
    envMapIntensity: 0.55,
    clearcoat: 0.15,
    clearcoatRoughness: 0.5,
  }),
};
