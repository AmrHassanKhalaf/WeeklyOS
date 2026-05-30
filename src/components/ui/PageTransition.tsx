import { type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useLocation } from 'react-router-dom'

/**
 * Smooth fade for route changes. Respects reduced-motion.
 * Wraps page-level content INSIDE AppLayout's <main> so the scroll region stays fixed.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation()
  const reduce = useReducedMotion()

  // Keep route transitions opacity-only so the fixed scroll container and
  // pointer hit-testing do not sit inside a moving full-page transform layer.
  const variants = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }

  return (
    <motion.div
      key={location.pathname}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={{ duration: reduce ? 0.01 : 0.2, ease: 'easeOut' }}
      className="w-full"
    >
      {children}
    </motion.div>
  )
}
