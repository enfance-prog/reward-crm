"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

const GLYPHS = ["★", "✦", "✧", "⋆", "✶", "✴", "·"];
const STAR_COLORS = [
  "#FFD54F",
  "#FFF8E1",
  "#FFECB3",
  "#FFE082",
  "#FFFFFF",
  "#FFF59D",
  "#FFC107",
  "#FFEE58",
];

type Particle = {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  rot: number;
  delay: number;
  size: number;
  duration: number;
  glyph: string;
  color: string;
  s0: number;
};

const PiroBurstContext = createContext<(clientX: number, clientY: number) => void>(() => {});

const BURST_COUNT = 34;
/** 最長 duration + delay + 余裕 */
const CLEANUP_MS = 3400;

export function usePiroBurst() {
  return useContext(PiroBurstContext);
}

export function PiroBurstProvider({ children }: { children: ReactNode }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const idRef = useRef(0);

  const spawnBurst = useCallback((clientX: number, clientY: number) => {
    const next: Particle[] = [];
    for (let i = 0; i < BURST_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 48 + Math.random() * 118;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      next.push({
        id: ++idRef.current,
        x: clientX,
        y: clientY,
        tx,
        ty,
        rot: (Math.random() - 0.5) * 720,
        delay: Math.random() * 0.14,
        size: 9 + Math.floor(Math.random() * 14),
        duration: 2.1 + Math.random() * 0.95,
        glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? "★",
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)] ?? "#FFD54F",
        s0: 0.15 + Math.random() * 0.35,
      });
    }
    const ids = new Set(next.map((p) => p.id));
    setParticles((prev) => [...prev, ...next]);
    window.setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !ids.has(p.id)));
    }, CLEANUP_MS);
  }, []);

  return (
    <PiroBurstContext.Provider value={spawnBurst}>
      {children}
      <div
        className="star-burst-layer pointer-events-none fixed inset-0 z-100000 overflow-hidden"
        aria-hidden
      >
        {particles.map((p) => {
          const style: CSSProperties = {
            position: "fixed",
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            zIndex: 100001,
            color: p.color,
            fontSize: p.size,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: `star-scatter-fly ${p.duration}s linear forwards`,
            animationDelay: `${p.delay}s`,
            ["--star-tx" as string]: `${p.tx}px`,
            ["--star-ty" as string]: `${p.ty}px`,
            ["--star-rot" as string]: `${p.rot}deg`,
            ["--star-s0" as string]: String(p.s0),
          };
          return (
            <span key={p.id} className="star-burst-particle select-none" style={style}>
              {p.glyph}
            </span>
          );
        })}
      </div>
    </PiroBurstContext.Provider>
  );
}
