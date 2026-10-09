import { createFileRoute } from "@tanstack/react-router";
import { Component, useEffect, useState, type ReactNode } from "react";
import { Box, Eye, Layers, RotateCcw, RotateCw } from "lucide-react";
import { TesCanvas } from "@/components/tes/viewer";
import {
  PARTS,
  PART_ORDER,
  VIEWS,
  VIEW_LIST,
  type Isolate,
  type PartId,
  type ShellMode,
  type Shot,
  type ViewId,
} from "@/components/tes/layout";

export const Route = createFileRoute("/")({ component: Home });

const SHELLS: { id: ShellMode; label: string }[] = [
  { id: "open", label: "Cutaway" },
  { id: "closed", label: "Closed" },
  { id: "xray", label: "X-ray" },
];

const WALLS: { id: Isolate; label: string }[] = [
  { id: "all", label: "Both walls" },
  { id: "process", label: "Process" },
  { id: "storage", label: "Storage" },
];

function ConceptSheet({ caption }: { caption: string }) {
  return (
    <figure className="flex h-full min-h-48 w-full flex-col items-center justify-center gap-2 bg-surface p-3">
      <img
        src="/tes-concept.jpg"
        alt="TES concept sheet, process wall on top and storage wall below"
        className="max-h-full w-full rounded-md object-contain"
      />
      <figcaption className="text-center text-xs text-muted">{caption}</figcaption>
    </figure>
  );
}

class StageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return <ConceptSheet caption="3D view could not start. This is the front and back concept." />;
    }
    return this.props.children;
  }
}

function Home() {
  const [mounted, setMounted] = useState(false);
  const [shell, setShell] = useState<ShellMode>("open");
  const [isolate, setIsolate] = useState<Isolate>("all");
  const [callouts, setCallouts] = useState(false);
  const [spin, setSpin] = useState(false);
  const [explode, setExplode] = useState(0);
  const [selected, setSelected] = useState<PartId | null>(null);
  const [showRef, setShowRef] = useState(false);
  const [view, setView] = useState<ViewId | null>("iso");
  const [shot, setShot] = useState<Shot & { n: number }>({ ...VIEWS.iso, n: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  function goView(id: ViewId) {
    setView(id);
    setSpin(false);
    setShot((prev) => ({ ...VIEWS[id], n: prev.n + 1 }));
    setIsolate((cur) => {
      if ((id === "front" || id === "utility") && cur === "storage") return "all";
      if (id === "back" && cur === "process") return "all";
      return cur;
    });
  }

  function showWall(id: Isolate) {
    setIsolate(id);
    const next: ViewId = id === "storage" ? "back" : id === "process" ? "front" : "iso";
    setView(next);
    setSpin(false);
    setShot((prev) => ({ ...VIEWS[next], n: prev.n + 1 }));
  }

  function goPart(id: PartId) {
    setSelected(id);
    setView(null);
    const focus = PARTS[id].focus;
    setShot((prev) => ({ pos: focus.pos, target: focus.target, n: prev.n + 1 }));
  }

  function yaw(dir: 1 | -1) {
    setView(null);
    setSpin(false);
    setShot((prev) => {
      const target = prev.target;
      const dx = prev.pos[0] - target[0];
      const dy = prev.pos[1] - target[1];
      const dz = prev.pos[2] - target[2];
      const angle = Math.atan2(dx, dz) + dir * (Math.PI / 4);
      const dist = Math.hypot(dx, dz);
      return {
        pos: [target[0] + Math.sin(angle) * dist, target[1] + dy, target[2] + Math.cos(angle) * dist],
        target,
        n: prev.n + 1,
      };
    });
  }

  const part = selected ? PARTS[selected] : null;

  return (
    <main className="flex h-full min-h-svh flex-col overflow-hidden bg-bg text-fg">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3">
        <div className="min-w-0">
          <h1 className="font-display text-3xl leading-none tracking-wide text-primary">TES</h1>
          <p className="truncate text-xs tracking-wide text-muted">Trinium Energy System · 40 ft container</p>
        </div>
        <p className="hidden text-right text-xs text-muted md:block">
          Drag to orbit 360° · scroll or pinch to zoom
          <br />
          40 ft × 8 ft × 8 ft 6 in
        </p>
      </header>

      <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-border bg-surface px-3 py-2">
        {VIEW_LIST.map((v) => (
          <button
            key={v.id}
            type="button"
            aria-pressed={view === v.id}
            className={
              view === v.id
                ? "h-11 shrink-0 rounded-md bg-primary px-3 text-sm font-medium text-primary-fg"
                : "h-11 shrink-0 rounded-md bg-chip px-3 text-sm font-medium text-fg"
            }
            onClick={() => goView(v.id)}
          >
            {v.label}
          </button>
        ))}
        <button
          type="button"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-chip px-3 text-sm font-medium text-fg"
          onClick={() => yaw(-1)}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Left
        </button>
        <button
          type="button"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-chip px-3 text-sm font-medium text-fg"
          onClick={() => yaw(1)}
        >
          <RotateCw className="size-4" aria-hidden="true" />
          Right
        </button>
        <button
          type="button"
          aria-pressed={spin}
          className={
            spin
              ? "inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-fg"
              : "inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-chip px-3 text-sm font-medium text-fg"
          }
          onClick={() => setSpin((v) => !v)}
        >
          <RotateCw className="size-4" aria-hidden="true" />
          Spin
        </button>
        <span className="mx-1 hidden w-px shrink-0 bg-border sm:block" />
        {SHELLS.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={shell === s.id}
            className={
              shell === s.id
                ? "h-11 shrink-0 rounded-md bg-primary px-3 text-sm font-medium text-primary-fg"
                : "h-11 shrink-0 rounded-md bg-chip px-3 text-sm font-medium text-fg"
            }
            onClick={() => setShell(s.id)}
          >
            {s.label}
          </button>
        ))}
        {WALLS.map((w) => (
          <button
            key={w.id}
            type="button"
            aria-pressed={isolate === w.id}
            className={
              isolate === w.id
                ? "h-11 shrink-0 rounded-md bg-primary px-3 text-sm font-medium text-primary-fg"
                : "h-11 shrink-0 rounded-md bg-chip px-3 text-sm font-medium text-fg"
            }
            onClick={() => showWall(w.id)}
          >
            {w.label}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={callouts}
          className={
            callouts
              ? "inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-fg"
              : "inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-chip px-3 text-sm font-medium text-fg"
          }
          onClick={() => setCallouts((v) => !v)}
        >
          <Eye className="size-4" aria-hidden="true" />
          Callouts
        </button>
        <button
          type="button"
          aria-pressed={showRef}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-chip px-3 text-sm font-medium text-fg"
          onClick={() => setShowRef((v) => !v)}
        >
          <Layers className="size-4" aria-hidden="true" />
          Concept
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <section className="tes-stage relative min-h-60 flex-1">
          <StageBoundary>
            {mounted ? (
              <TesCanvas
                shell={shell}
                explode={explode}
                callouts={callouts}
                spin={spin}
                showProcess={isolate !== "storage"}
                showStorage={isolate !== "process"}
                selected={selected}
                shot={shot}
                onSelect={setSelected}
              />
            ) : (
              <ConceptSheet caption="Loading the 3D container. This is your front and back concept." />
            )}
          </StageBoundary>
          <p className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[16rem] rounded-md bg-surface px-3 py-2 text-xs text-muted">
            Drag the model for a full 360°. Front is the process wall. Back is the storage tanks.
          </p>
          {showRef && (
            <div className="absolute inset-3 z-20 flex items-center justify-center">
              <ConceptSheet caption="Concept sheet — process wall on top, storage wall below." />
            </div>
          )}
        </section>

        <aside className="flex max-h-[46%] shrink-0 flex-col gap-3 overflow-y-auto border-t border-border bg-surface p-4 md:max-h-none md:w-80 md:border-t-0 md:border-l">
          <figure className="overflow-hidden rounded-md border border-border bg-bg">
            <img
              src="/tes-concept.jpg"
              alt="TES concept sheet, process wall on top and storage wall below"
              className="h-40 w-full object-contain md:h-52"
            />
            <figcaption className="px-2 py-1.5 text-xs text-muted">
              Your concept — front (process) on top, back (tanks) below
            </figcaption>
          </figure>
          <div>
            <h2 className="font-display text-2xl leading-none tracking-wide text-primary">
              {part ? part.name : "Full assembly"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {part
                ? part.summary
                : "Drag to orbit the full container. Front matches the process wall in the concept. Back matches the electrolyte and fuel tanks. Orange lines are process and fuel. Blue lines are water."}
            </p>
            {part && (
              <button
                type="button"
                className="mt-3 inline-flex h-11 items-center gap-2 rounded-md bg-chip px-3 text-sm font-medium text-fg"
                onClick={() => setSelected(null)}
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Clear selection
              </button>
            )}
          </div>

          <label className="block text-sm text-fg">
            <span className="mb-1 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 font-medium">
                <Box className="size-4 text-primary" aria-hidden="true" />
                Explode
              </span>
              <span className="tabular-nums text-muted">{Math.round(explode * 100)}%</span>
            </span>
            <input
              className="h-11 w-full"
              type="range"
              min={0}
              max={100}
              value={Math.round(explode * 100)}
              onChange={(e) => setExplode(Number(e.target.value) / 100)}
              aria-label="Explode assembly"
            />
          </label>

          <ul className="flex gap-3 text-xs text-muted">
            <li className="flex items-center gap-2">
              <span className="size-2.5 rounded-sm bg-accent" />
              Process / fuel
            </li>
            <li className="flex items-center gap-2">
              <span className="size-2.5 rounded-sm bg-primary" />
              Water
            </li>
          </ul>

          <div className="flex flex-col gap-1">
            {PART_ORDER.map((id) => {
              const info = PARTS[id];
              const active = selected === id;
              const prev = PART_ORDER[PART_ORDER.indexOf(id) - 1];
              const head = !prev || PARTS[prev].wall !== info.wall;
              return (
                <div key={id}>
                  {head && (
                    <p className="mt-3 mb-1 font-display text-sm tracking-wide text-muted">{info.wall}</p>
                  )}
                  <button
                    type="button"
                    aria-pressed={active}
                    className={
                      active
                        ? "h-11 w-full rounded-md bg-primary px-3 text-left text-sm font-medium text-primary-fg"
                        : "h-11 w-full rounded-md px-3 text-left text-sm text-fg hover:bg-chip"
                    }
                    onClick={() => goPart(id)}
                  >
                    {info.name}
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted">Civis Tech Global · concept model</p>
        </aside>
      </div>
    </main>
  );
}
