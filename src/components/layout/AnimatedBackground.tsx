import { useEffect, useRef } from 'react'

/**
 * AnimatedBackground
 * ─────────────────────────────────────────────────────────────────────────────
 * Fixed full-viewport ambient background composed of:
 *   • Static base color (anti-FOUC)
 *   • The purple-wave image with a very slow CSS float
 *   • Two breathing radial glows (opacity-only animation — GPU friendly)
 *   • A light bottom-right edge accent
 *   • A subtle mouse-driven parallax that runs only while the mouse moves
 *   • Top vignette to keep the header readable
 *
 * Performance notes:
 *   • All motion targets opacity or transform — never layout-triggering props.
 *   • The mouse-parallax RAF loop only runs when the cursor is moving and
 *     pauses itself once the target offset has been reached. Previously a
 *     persistent RAF ran every frame even when idle, burning ~5-8 % CPU.
 *   • The expensive `filter: blur(28px)` haze layer was removed — that filter
 *     forces an offscreen composite on every frame and was the single biggest
 *     paint cost in the app.
 *   • The mouse listener is disabled on touch / small-screen devices and when
 *     the user prefers reduced motion.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function AnimatedBackground() {
  const parallaxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Bail early on touch devices and reduced-motion users — saves an RAF loop
    // on phones (where parallax can't be triggered anyway) and respects a11y.
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isTouch = window.matchMedia('(hover: none)').matches
    if (prefersReducedMotion || isTouch) return

    let raf = 0
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    let running = false

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    const tick = () => {
      currentX = lerp(currentX, targetX, 0.08)
      currentY = lerp(currentY, targetY, 0.08)

      if (parallaxRef.current) {
        parallaxRef.current.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`
      }

      // Stop once we've effectively reached the target — avoids burning frames
      // when the cursor is idle.
      const dx = Math.abs(currentX - targetX)
      const dy = Math.abs(currentY - targetY)
      if (dx < 0.05 && dy < 0.05) {
        currentX = targetX
        currentY = targetY
        running = false
        return
      }
      raf = requestAnimationFrame(tick)
    }

    const startLoop = () => {
      if (running) return
      running = true
      raf = requestAnimationFrame(tick)
    }

    const onMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 14
      targetY = (e.clientY / window.innerHeight - 0.5) * 8
      startLoop()
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      if (raf) cancelAnimationFrame(raf)
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
      {/* Solid base — prevents FOUC and keeps text readable while image loads */}
      <div style={{ position: 'absolute', inset: 0, background: '#070509' }} />

      {/* Main image — slow CSS float + opt-in JS parallax */}
      <div
        ref={parallaxRef}
        style={{
          position: 'absolute',
          inset: '-3% -2%',
          willChange: 'transform',
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

      {/* Breathing glow over the wave region */}
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

      {/* Secondary breathing pulse (slightly offset phase) */}
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

      {/* Bottom-right edge accent */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '50%',
          height: '35%',
          background:
            'radial-gradient(ellipse at bottom right, rgba(140,40,220,0.12) 0%, transparent 60%)',
        }}
      />

      {/* Top vignette — keeps header text legible */}
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
