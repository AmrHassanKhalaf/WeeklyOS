import { useEffect, useRef } from 'react'

/**
 * AnimatedBackground
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders the purple-wave image as the global fixed background, enriched with
 * layered ambient-motion effects:
 *   • Slow vertical float on the image (GPU transform)
 *   • Breathing glow radial overlays
 *   • Drifting fog / haze layer
 *   • Diagonal shimmer sweep
 *   • Soft edge pulse
 *   • Subtle mouse-parallax offset
 *
 * All animations target GPU-composited properties (transform, opacity) only.
 * No layout-triggering changes, no heavy paint operations.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function AnimatedBackground() {
  const parallaxRef = useRef<HTMLDivElement>(null)

  /* ── Mouse parallax ─────────────────────────────────────────────────────── */
  useEffect(() => {
    let raf: number | null = null
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0

    const onMouseMove = (e: MouseEvent) => {
      // Map mouse position to ±14px / ±8px range
      targetX = (e.clientX / window.innerWidth  - 0.5) * 14
      targetY = (e.clientY / window.innerHeight - 0.5) * 8
    }

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    const tick = () => {
      currentX = lerp(currentX, targetX, 0.04)
      currentY = lerp(currentY, targetY, 0.04)
      if (parallaxRef.current) {
        parallaxRef.current.style.transform =
          `translate3d(${currentX}px, ${currentY}px, 0)`
      }
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      if (raf !== null) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className="bg-scene"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* ── Layer 0 · Solid base colour (prevents FOUC) ─────────────────── */}
      <div style={{ position: 'absolute', inset: 0, background: '#070509' }} />

      {/* ── Layer 1 · Main image with parallax + slow float ─────────────── */}
      <div
        ref={parallaxRef}
        style={{
          position: 'absolute',
          /* Slightly oversized so parallax offset doesn't reveal edges */
          inset: '-3% -2%',
          willChange: 'transform',
          transition: 'transform 0.1s linear',
        }}
      >
        <div
          className="bg-wave-image"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/bg-wave.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 60%',
            backgroundRepeat: 'no-repeat',
            opacity: 0.85,
            animation: 'waveFloat 18s ease-in-out infinite',
            willChange: 'transform',
          }}
        />
      </div>

      {/* ── Layer 2 · Breathing glow · purple blob over wave region ──────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 70% 40% at 65% 65%, rgba(120,30,180,0.22) 0%, transparent 70%)',
          animation: 'breatheGlow 7s ease-in-out infinite',
          willChange: 'opacity',
        }}
      />
      {/* Secondary breath pulse — slightly offset in phase */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 50% 28% at 30% 55%, rgba(90,20,150,0.14) 0%, transparent 65%)',
          animation: 'breatheGlow 9s ease-in-out 1.5s infinite',
          willChange: 'opacity',
        }}
      />

      {/* ── Layer 3 · Drifting haze / fog ───────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 120% 30% at 50% 58%, rgba(100,20,160,0.08) 0%, transparent 60%)',
          filter: 'blur(28px)',
          animation: 'hazeDrift 24s ease-in-out infinite',
          willChange: 'transform, opacity',
        }}
      />

      {/* ── Layer 4 · Diagonal shimmer sweep ────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(105deg, transparent 35%, rgba(180,100,255,0.04) 50%, transparent 65%)',
          animation: 'shimmerSweep 28s linear infinite',
          willChange: 'transform',
        }}
      />

      {/* ── Layer 5 · Soft ambient edge glows ───────────────────────────── */}
      {/* Bottom-right edge pulse */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '50%',
          height: '35%',
          background:
            'radial-gradient(ellipse at bottom right, rgba(140,40,220,0.12) 0%, transparent 60%)',
          animation: 'edgePulse 6s ease-in-out infinite',
          willChange: 'opacity',
        }}
      />
      {/* Left edge accent */}
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          left: 0,
          width: '30%',
          height: '25%',
          background:
            'radial-gradient(ellipse at left, rgba(110,30,190,0.10) 0%, transparent 60%)',
          animation: 'edgePulse 8s ease-in-out 2s infinite',
          willChange: 'opacity',
        }}
      />

      {/* ── Layer 6 · Top veil (keeps header area dark + readable) ──────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(7,5,9,0.70) 0%, rgba(7,5,9,0.30) 30%, rgba(7,5,9,0.25) 60%, rgba(7,5,9,0.55) 100%)',
        }}
      />
    </div>
  )
}
