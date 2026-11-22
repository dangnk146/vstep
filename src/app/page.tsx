'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Database, Heart, Lightbulb } from 'lucide-react';

const DENSITY_CHARS = ' .:-=+*#%@';

interface ClickRipple {
  x: number;
  y: number;
  startTime: number;
}

/**
 * Interactive 60fps OpenClaw-style ASCII wave canopy:
 * - Continuously radiates concentric ASCII wave rings outward from behind the mascot.
 * - Hovering / moving cursor pushes characters radially outward (magnetic repulsion)
 *   and intensifies/bolds the glyphs around the pointer.
 * - Clicking / tapping spawns an extra expanding ripple pulse.
 * - Automatically syncs colors with Light & Dark theme.
 */
function InteractiveAsciiCanopy() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let width = 0;
    let height = 0;
    let isDark = document.documentElement.classList.contains('dark');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const pointer = {
      x: -9999,
      y: -9999,
      targetX: -9999,
      targetY: -9999,
      active: false,
      strength: 0,
    };

    const ripples: ClickRipple[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      if (localY >= -60 && localY <= rect.height + 80) {
        pointer.targetX = localX;
        pointer.targetY = localY;
        if (!pointer.active) {
          pointer.x = localX;
          pointer.y = localY;
        }
        pointer.active = true;
      } else {
        pointer.active = false;
      }
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    const handlePointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      if (localY >= 0 && localY <= rect.height + 40) {
        ripples.push({ x: localX, y: localY, startTime: performance.now() * 0.001 });
        if (ripples.length > 4) ripples.shift();
      }
    };

    // Observe Light / Dark theme class toggles on <html>
    const themeObserver = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains('dark');
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    const render = (nowMs: number) => {
      const t = prefersReducedMotion ? 0 : nowMs * 0.001;

      // Smooth pointer tracking & active fade
      if (pointer.active) {
        pointer.x += (pointer.targetX - pointer.x) * 0.2;
        pointer.y += (pointer.targetY - pointer.y) * 0.2;
        pointer.strength += (1 - pointer.strength) * 0.16;
      } else {
        pointer.strength += (0 - pointer.strength) * 0.08;
      }

      // Prune finished click ripples
      while (ripples.length > 0 && t - ripples[0].startTime > 2.4) {
        ripples.shift();
      }

      ctx.clearRect(0, 0, width, height);

      const cellX = width < 640 ? 11 : 13;
      const cellY = width < 640 ? 14 : 16;
      const fontSize = width < 640 ? 10 : 12;
      const cols = Math.ceil(width / cellX) + 1;
      const rows = Math.ceil(height / cellY) + 1;

      // Wave origin sits right behind the mascot at bottom-center of the canopy
      const originX = width * 0.5;
      const originY = height * 0.82;
      const maxDist = Math.max(width * 0.58, height * 1.15);
      const hoverRadius = width < 640 ? 105 : 150;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const baseFont = `600 ${fontSize}px var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace`;
      const boldFont = `800 ${fontSize + 1}px var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace`;

      for (let r = 0; r < rows; r += 1) {
        const baseY = r * cellY + cellY * 0.5;
        // Fade cleanly toward bottom edge and very top edge
        const yNorm = baseY / height;
        const bottomFade = yNorm > 0.78 ? Math.max(0, 1 - (yNorm - 0.78) / 0.22) : 1;
        if (bottomFade <= 0.01) continue;

        for (let c = 0; c < cols; c += 1) {
          const baseX = c * cellX + cellX * 0.5;
          const dx0 = (baseX - originX) * 0.72;
          const dy0 = (baseY - originY) * 1.25;
          const dist = Math.sqrt(dx0 * dx0 + dy0 * dy0);

          // Expanding outward waves from mascot
          const wave1 = Math.sin(dist * 0.052 - t * 2.15);
          const wave2 = Math.sin(dist * 0.028 - t * 1.1 + 1.4);
          const combinedWave = wave1 * 0.72 + wave2 * 0.28;

          // Center radial halo around mascot
          const centerGlow = Math.exp(-(dist * dist) / (maxDist * maxDist * 0.08));
          const edgeFade = Math.max(0, 1 - dist / (maxDist * 0.96));

          let intensity = 0;
          if (combinedWave > 0.16) {
            intensity = ((combinedWave - 0.16) / 0.84) * edgeFade * 0.78;
          }
          intensity = Math.max(intensity, centerGlow * 0.86);

          // Add expanding click/tap ripples
          for (let i = 0; i < ripples.length; i += 1) {
            const rp = ripples[i];
            const age = t - rp.startTime;
            const rpRadius = age * 260;
            const rdx = baseX - rp.x;
            const rdy = baseY - rp.y;
            const rDist = Math.sqrt(rdx * rdx + rdy * rdy);
            const band = Math.exp(-((rDist - rpRadius) ** 2) / 950);
            const decay = Math.max(0, 1 - age / 2.2);
            intensity = Math.max(intensity, band * decay * 0.95);
          }

          // Interactive cursor repulsion + bold highlight
          let drawX = baseX;
          let drawY = baseY;
          let hoverBoost = 0;

          if (pointer.strength > 0.01) {
            const mdx = baseX - pointer.x;
            const mdy = baseY - pointer.y;
            const mDistSq = mdx * mdx + mdy * mdy;

            if (mDistSq < hoverRadius * hoverRadius) {
              const mDist = Math.sqrt(mDistSq) || 0.001;
              const prox = 1 - mDist / hoverRadius;
              const smoothProx = prox * prox * (3 - 2 * prox);

              // Push particles radially outward away from cursor (like parting wave field)
              const push = smoothProx * 22 * pointer.strength;
              drawX += (mdx / mDist) * push;
              drawY += (mdy / mDist) * push;

              // Intensify & bold glyphs near cursor (stronger ring boost around cursor edge)
              hoverBoost = smoothProx * pointer.strength;
              intensity = Math.min(1, Math.max(intensity, 0.25) + hoverBoost * 0.72);
            }
          }

          // Subtle background dot grid where waves are quiet
          let char = '';
          let alpha = 0;

          if (intensity < 0.08) {
            if (r % 2 === 0 && c % 3 === 0 && edgeFade > 0.05) {
              char = '.';
              alpha = (isDark ? 0.16 : 0.14) * edgeFade * bottomFade;
            } else {
              continue;
            }
          } else {
            const idx = Math.min(
              DENSITY_CHARS.length - 1,
              Math.max(1, Math.floor(intensity * (DENSITY_CHARS.length - 1)))
            );
            char = DENSITY_CHARS[idx];
            alpha = Math.min(
              1,
              ((isDark ? 0.22 : 0.2) + intensity * (isDark ? 0.68 : 0.62) + hoverBoost * 0.35) *
              bottomFade
            );
          }

          // Crisp highlight color when hovered/intensified, synced with app Light & Dark palette
          if (hoverBoost > 0.18) {
            ctx.font = boldFont;
            ctx.fillStyle = isDark
              ? `rgba(125, 211, 252, ${alpha.toFixed(3)})` // luminous sky-300
              : `rgba(3, 105, 161, ${alpha.toFixed(3)})`; // deep sky-700
          } else {
            ctx.font = baseFont;
            ctx.fillStyle = isDark
              ? `rgba(14, 165, 233, ${alpha.toFixed(3)})` // --primary dark (#0ea5e9)
              : `rgba(2, 132, 199, ${alpha.toFixed(3)})`; // --primary light (#0284c7)
          }

          ctx.fillText(char, drawX, drawY);
        }
      }

      if (!prefersReducedMotion) {
        rafId = window.requestAnimationFrame(render);
      }
    };

    rafId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(rafId);
      themeObserver.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-[44%] sm:h-[48%] w-full select-none"
    />
  );
}

function VstepMascot() {
  return (
    <div className="relative inline-flex items-center justify-center group">
      {/* Ambient theme-synced radial glow behind mascot */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-24 w-24 rounded-full bg-primary/25 dark:bg-primary/35 blur-2xl transition-transform duration-500 group-hover:scale-125"
      />
      <svg
        viewBox="0 0 96 96"
        className="relative h-14 w-14 sm:h-20 sm:w-20 animate-mascot-float drop-shadow-[0_8px_18px_rgba(2,132,199,0.35)] dark:drop-shadow-[0_10px_24px_rgba(14,165,233,0.45)] transition-transform duration-300 group-hover:scale-110"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="vstepMascotBody" cx="35%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="55%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#245b86" />
          </radialGradient>
          <linearGradient id="vstepMascotAccent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>

        {/* Cute antennae */}
        <path
          d="M36 24 C33 15, 27 12, 24 14"
          fill="none"
          stroke="url(#vstepMascotAccent)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M60 24 C63 15, 69 12, 72 14"
          fill="none"
          stroke="url(#vstepMascotAccent)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <circle cx="24" cy="14" r="3" fill="#38bdf8" />
        <circle cx="72" cy="14" r="3" fill="#38bdf8" />

        {/* Little legs */}
        <rect x="35" y="70" width="9" height="13" rx="4.5" fill="#245b86" />
        <rect x="52" y="70" width="9" height="13" rx="4.5" fill="#245b86" />

        {/* Side nubs / tiny claws */}
        <ellipse cx="17" cy="49" rx="7.5" ry="6" fill="url(#vstepMascotBody)" />
        <ellipse cx="79" cy="49" rx="7.5" ry="6" fill="url(#vstepMascotBody)" />

        {/* Main round glossy body */}
        <ellipse cx="48" cy="48" rx="28" ry="27" fill="url(#vstepMascotBody)" />

        {/* Top soft specular highlight */}
        <ellipse cx="39" cy="33" rx="11" ry="5.5" fill="#ffffff" opacity="0.24" transform="rotate(-18 39 33)" />

        {/* Expressive eyes with gentle blink */}
        <g className="animate-mascot-blink">
          <circle cx="38" cy="45" r="4.2" fill="#090d16" />
          <circle cx="58" cy="45" r="4.2" fill="#090d16" />
          <circle cx="36.6" cy="43.5" r="1.4" fill="#ffffff" />
          <circle cx="56.6" cy="43.5" r="1.4" fill="#ffffff" />
        </g>

        {/* Subtle happy blush & tiny smile */}
        <ellipse cx="31" cy="52" rx="3.2" ry="1.8" fill="#f472b6" opacity="0.45" />
        <ellipse cx="65" cy="52" rx="3.2" ry="1.8" fill="#f472b6" opacity="0.45" />
        <path
          d="M44 53 Q48 56.5 52 53"
          fill="none"
          stroke="#090d16"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.75"
        />
      </svg>
    </div>
  );
}

export default function Home() {
  return (
    <section
      aria-label="Trang chủ VSTEP Prep"
      className="fixed inset-x-0 top-0 bottom-12 z-40 flex flex-col items-center justify-center bg-background text-foreground overflow-hidden overscroll-none px-4 pt-[env(safe-area-inset-top)] text-center animate-fade-in"
    >
      {/* Ambient top radial light matching app's Sky Blue palette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[440px] bg-[radial-gradient(ellipse_70%_55%_at_50%_18%,rgba(2,132,199,0.14),transparent_72%)] dark:bg-[radial-gradient(ellipse_70%_55%_at_50%_18%,rgba(14,165,233,0.18),transparent_72%)]"
      />

      {/* Interactive Radiating ASCII Wave Canopy */}
      <InteractiveAsciiCanopy />

      {/* Center Content Stack */}
      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center mt-8 sm:mt-14">
        {/* Cute Mascot */}
        <div className="mb-2.5 sm:mb-3.5">
          <VstepMascot />
        </div>

        {/* Mono Kicker */}
        <p className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-primary">
          B1-B2 · VSTEP
        </p>

        {/* Bold OpenClaw-style Hero Headline (exact Geist Sans font) */}
        <h1 className="mt-2.5 sm:mt-3.5 text-3xl sm:text-5xl md:text-[3.5rem] font-black tracking-tight leading-[1.08] text-foreground">
          Trợ lý{' '}
          <em className="italic font-extrabold text-vstep-gradient pr-1">
            chạm aim
          </em>{' '}
          VSTEP
        </h1>

        {/* Clean 3-Line Subtitle */}
        <div className="mt-3 sm:mt-4 max-w-2xl space-y-0.5 sm:space-y-1 text-xs sm:text-[15px] leading-relaxed text-muted-foreground font-normal">
          <p>
            Tổng hợp ngân hàng đề thi từ VLU, UEF, HCMUE, HANU, HUST.
          </p>
          <p>
            Mindmap và Anki.
          </p>
          <p>
            Luyện tập trên máy tính và mobile.
          </p>
        </div>

        {/* Italic Note + Mono Tagline */}
        <div className="mt-3.5 sm:mt-5 space-y-1">
          <p className="italic text-[11.5px] sm:text-[13px] text-muted-foreground/85">
            Không tài khoản. Không lưu gì.
          </p>
          <p className="font-mono text-[10.5px] sm:text-xs font-semibold tracking-wide text-primary">
            Đề thi của bạn. Mindmap của bạn. Nhịp ôn của bạn. Mục tiêu B2 của bạn.
          </p>
        </div>

        {/* 3 Hero CTA Buttons: Trang Đề Thi · Trang Mindmap · Trang Dating */}
        <div className="mt-5 sm:mt-8 flex w-full max-w-xl flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3">
          {/* 1. Trang Đề Thi (Primary VSTEP Sky-Blue Hero) */}
          <Link
            href="/prompts"
            className="btn-vstep-hero group inline-flex h-10.5 sm:h-12 items-center justify-center gap-2 rounded-xl px-5 sm:px-6 text-xs sm:text-sm font-black tracking-tight transition-all duration-200 hover:-translate-y-0.5 hover:brightness-108 active:scale-96 cursor-pointer"
          >
            <Database className="h-4 w-4 shrink-0 text-white" />
            <span>Trang Đề Thi</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>

          {/* 2. Trang Mindmap (Metallic Silver / Sleek Dark Chrome) */}
          <Link
            href="/mindmap"
            className="btn-metallic-silver group inline-flex h-10.5 sm:h-12 items-center justify-center gap-2 rounded-xl px-5 sm:px-6 text-xs sm:text-sm font-black tracking-tight transition-all duration-200 hover:-translate-y-0.5 active:scale-96 cursor-pointer"
          >
            <Lightbulb className="h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400 transition-transform duration-300 group-hover:scale-115 group-hover:rotate-6" />
            <span>Trang Mindmap</span>
          </Link>

          {/* 3. Trang Dating (Iridescent Pink + White Heart) */}
          <Link
            href="/dating"
            className="btn-dating-pink group inline-flex h-10.5 sm:h-12 items-center justify-center gap-2 rounded-xl px-5 sm:px-6 text-xs sm:text-sm font-black tracking-tight transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-96 cursor-pointer"
          >
            <Heart className="h-4 w-4 shrink-0 fill-white text-white transition-transform duration-300 group-hover:scale-115" />
            <span>Trang Dating</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
