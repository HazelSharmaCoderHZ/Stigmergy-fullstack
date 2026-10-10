import React, { useEffect, useRef } from 'react';

interface MeshNode {
  baseX: number; // 0..1 relative position
  baseY: number;
  driftPhase: number;
  driftSpeed: number;
  radius: number;
  glow: number;
}

interface MeshLink {
  a: number;
  b: number;
  pulsed: boolean;
  pulseOffset: number;
  color: string;
}

const NODE_COUNT = 36;
const ROW_COUNT = 6;
const CONNECT_DISTANCE = 0.17; // fraction of the smaller dimension
const PULSE_LINK_FRACTION = 0.45;

/**
 * Subtle electricity-inspired transmission mesh rendered on a lightweight
 * <canvas>. The network itself is geometrically stable (a very slow drift only)
 * while small light pulses travel along a subset of the connections. Restrained
 * navy / blue / cyan tones keep the landing text highly readable.
 *
 * Decorative only: the pulses are a visual metaphor and encode no direction or
 * measured value. Pauses when off-screen and respects prefers-reduced-motion.
 */
export const ElectricMeshBackground: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    // Deterministic pseudo-random generator so the mesh is stable across mounts.
    const rand = (() => {
      let seed = 0x2f6e2b1;
      return () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };
    })();

    // Layered bands with jitter read like a transmission network.
    const nodes: MeshNode[] = [];
    const bandCount = Math.ceil(NODE_COUNT / ROW_COUNT);
    for (let i = 0; i < NODE_COUNT; i++) {
      const band = i % ROW_COUNT;
      const inBand = Math.floor(i / ROW_COUNT);
      nodes.push({
        baseX: Math.min(0.94, Math.max(0.06, (inBand + 0.5 + (rand() - 0.5) * 0.7) / bandCount)),
        baseY: Math.min(0.94, Math.max(0.06, (band + 0.5 + (rand() - 0.5) * 0.55) / ROW_COUNT)),
        driftPhase: rand() * Math.PI * 2,
        driftSpeed: 0.00006 + rand() * 0.00008,
        radius: 1.1 + rand() * 1.1,
        glow: 0.05 + rand() * 0.07,
      });
    }

    // Connect nearby nodes with thin corridors.
    const links: MeshLink[] = [];
    for (let a = 0; a < nodes.length; a++) {
      for (let b = a + 1; b < nodes.length; b++) {
        const dx = nodes[a].baseX - nodes[b].baseX;
        const dy = nodes[a].baseY - nodes[b].baseY;
        if (Math.hypot(dx, dy) < CONNECT_DISTANCE) {
          links.push({
            a,
            b,
            pulsed: rand() < PULSE_LINK_FRACTION,
            pulseOffset: rand(),
            color: rand() < 0.5 ? '34, 211, 238' : '59, 130, 246', // cyan / blue
          });
        }
      }
    }

    let width = 0;
    let height = 0;
    let raf = 0;
    let running = true;

    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const nodeX = (node: MeshNode, t: number) =>
      node.baseX * width + Math.sin(t * node.driftSpeed + node.driftPhase) * width * 0.006;
    const nodeY = (node: MeshNode, t: number) =>
      node.baseY * height + Math.cos(t * node.driftSpeed * 0.8 + node.driftPhase) * height * 0.006;

    const render = (t: number) => {
      ctx.clearRect(0, 0, width, height);

      // 1. Transmission corridors.
      ctx.lineWidth = 1;
      links.forEach((link) => {
        const a = nodes[link.a];
        const b = nodes[link.b];
        ctx.strokeStyle = 'rgba(30, 64, 175, 0.10)';
        ctx.beginPath();
        ctx.moveTo(nodeX(a, t), nodeY(a, t));
        ctx.lineTo(nodeX(b, t), nodeY(b, t));
        ctx.stroke();
      });

      // 2. Occasional pulses of light travelling along a subset of corridors.
      if (!reducedMotion) {
        links.forEach((link) => {
          if (!link.pulsed) return;
          const a = nodes[link.a];
          const b = nodes[link.b];
          const cycle = (t * 0.00005 + link.pulseOffset) % 1;
          const active = cycle > 0.55; // pulse travels for ~45% of its cycle
          if (!active) return;
          const progress = (cycle - 0.55) / 0.45;
          const px = nodeX(a, t) + (nodeX(b, t) - nodeX(a, t)) * progress;
          const py = nodeY(a, t) + (nodeY(b, t) - nodeY(a, t)) * progress;
          const alpha = Math.sin(progress * Math.PI); // fade in and out
          const glow = ctx.createRadialGradient(px, py, 0, px, py, 8);
          glow.addColorStop(0, `rgba(${link.color}, ${0.55 * alpha})`);
          glow.addColorStop(1, `rgba(${link.color}, 0)`);
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(px, py, 8, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // 3. Subtly illuminated nodes.
      nodes.forEach((node) => {
        const x = nodeX(node, t);
        const y = nodeY(node, t);
        const halo = ctx.createRadialGradient(x, y, 0, x, y, node.radius * 6);
        halo.addColorStop(0, `rgba(59, 130, 246, ${node.glow})`);
        halo.addColorStop(1, 'rgba(59, 130, 246, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(x, y, node.radius * 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(30, 64, 175, 0.35)';
        ctx.beginPath();
        ctx.arc(x, y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const loop = (time: number) => {
      if (!running) return;
      render(time);
      raf = requestAnimationFrame(loop);
    };

    resize();
    if (reducedMotion) {
      render(0); // single static frame
    } else {
      raf = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);

    // Pause the loop while off-screen to keep CPU usage negligible.
    const io = new IntersectionObserver(([entry]) => {
      if (reducedMotion) return;
      if (entry.isIntersecting && !running) {
        running = true;
        raf = requestAnimationFrame(loop);
      } else if (!entry.isIntersecting && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(wrapper);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
};

