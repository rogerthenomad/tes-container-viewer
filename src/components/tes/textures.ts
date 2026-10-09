import * as THREE from "three";

const cache = new Map<string, THREE.CanvasTexture>();

function make(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  cache.set(key, tex);
  return tex;
}

export function plate(text: string, bg: string, fg: string) {
  return make(`plate:${text}:${bg}:${fg}`, 1024, 512, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = fg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let size = text.length > 18 ? 72 : text.length > 10 ? 110 : 168;
    const font = () => `700 ${size}px Arial, Helvetica, sans-serif`;
    ctx.font = font();
    while (ctx.measureText(text).width > w * 0.88 && size > 36) {
      size -= 4;
      ctx.font = font();
    }
    ctx.fillText(text, w / 2, h / 2);
  });
}

export function tesMark() {
  return make("tes-mark", 1024, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#163e8a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 250px Arial, Helvetica, sans-serif";
    ctx.fillText("TES", w / 2, h * 0.4);
    ctx.font = "500 48px Arial, Helvetica, sans-serif";
    ctx.fillText("Trinium Energy System", w / 2, h * 0.74);
  });
}

export function hmiTexture() {
  return make("hmi", 512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#102f68";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#d7e6ff";
    ctx.font = "700 54px Arial, Helvetica, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("AI / EMS", 36, 58);
    ctx.strokeStyle = "#2c6fbe";
    ctx.lineWidth = 2;
    for (let i = 1; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(28, 100 + i * 62);
      ctx.lineTo(w - 28, 100 + i * 62);
      ctx.stroke();
    }
    ctx.strokeStyle = "#8dffa8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 22; i++) {
      const x = 40 + i * 20;
      const y = 300 + Math.sin(i * 0.62) * 36 + (i % 4) * 6;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = "#8dffa8";
    ctx.fillRect(36, 430, 18, 18);
    ctx.fillStyle = "#d36a22";
    ctx.fillRect(70, 430, 18, 18);
    ctx.fillStyle = "#d7e6ff";
    ctx.font = "500 28px Arial, Helvetica, sans-serif";
    ctx.fillText("CONCEPT HMI", 104, 440);
  });
}

export function arrowPlate() {
  return make("arrow-plate", 1024, 256, (ctx, w, h) => {
    ctx.fillStyle = "#e8eef4";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#163e8a";
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = "#163e8a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 64px Arial, Helvetica, sans-serif";
    ctx.fillText("WATER OUTLET MANIFOLD", w / 2, h * 0.38);
    ctx.font = "500 36px Arial, Helvetica, sans-serif";
    ctx.fillText("TO EXTERNAL COLLECTION  →", w / 2, h * 0.7);
  });
}
