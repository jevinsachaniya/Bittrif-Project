import { useEffect, useLayoutEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion, useScroll } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { installScrollReveals } from '../lib/scrollReveals'

export function Reveal({ children, className = '', delay = 0 }) {
  return <div className={className} data-scroll-reveal="up" data-scroll-reveal-delay={delay}>{children}</div>
}

export default function SiteExperience() {
  const { pathname } = useLocation()
  const { scrollYProgress } = useScroll()
  const reducedMotion = useReducedMotion()
  const [showTop, setShowTop] = useState(false)

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  useLayoutEffect(() => {
    if (reducedMotion) return
    return installScrollReveals(document.getElementById('root'))
  }, [pathname, reducedMotion])

  useEffect(() => {
    const update = () => setShowTop(window.scrollY > 600)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return <>
    <motion.div className="reading-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />
    <AnimatePresence>{showTop && <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' })} className="back-to-top" aria-label="Back to top"><ArrowUp size={20} /></motion.button>}</AnimatePresence>
  </>
}
