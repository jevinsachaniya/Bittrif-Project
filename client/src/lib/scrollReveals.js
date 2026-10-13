const SCOPE = '.route-content, .page-shell, .admin-page-content, .site-footer'
const TARGETS = '[data-scroll-reveal], .card, .surface-panel, article, form, .product-image-frame, .collection-card, h1, h2, h3, p, img'
const EXCLUDED = '.cinematic-hero, [data-scroll-reveal="off"], nav, header, button, label, table, [role="dialog"], .skeleton, .sticky, .fixed'

// One observer handles every route, including lazy pages and API-loaded cards.
// Content is visible by default; only supported, motion-enabled clients opt in.
export function installScrollReveals(root) {
  if (!root || !window.IntersectionObserver || !window.MutationObserver) return () => {}
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (preference.matches) return () => {}

  const tracked = new Set()
  const queue = new Set()
  let frame = null
  let disposed = false

  const finish = (element) => {
    element.classList.remove('scroll-reveal-pending', 'scroll-reveal-entering')
    element.style.removeProperty('--scroll-reveal-delay')
    element.dataset.scrollRevealState = 'shown'
    observer.unobserve(element)
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      const element = entry.target
      observer.unobserve(element)
      element.dataset.scrollRevealState = 'entering'
      element.classList.remove('scroll-reveal-pending')
      element.classList.add('scroll-reveal-entering')
    }
  }, { threshold: 0, rootMargin: '0px 0px -40px 0px' })

  const register = (element) => {
    if (tracked.has(element) || !element.closest(SCOPE) || element.closest(EXCLUDED)) return
    // Let a card or explicitly grouped block reveal as one piece, not twice.
    if (element.parentElement?.closest('[data-scroll-reveal-state]')) return
    const bounds = element.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return
    // Tall forms and panels reveal their individual contents as you reach them.
    if (bounds.height > window.innerHeight * 0.85) return
    if (element.tagName === 'IMG' && (element.classList.contains('absolute') || bounds.width < 100)) return

    tracked.add(element)
    if (bounds.bottom <= 0 || element.contains(document.activeElement)) {
      element.dataset.scrollRevealState = 'shown'
      return
    }
    const siblings = [...element.parentElement.children].filter((sibling) => sibling.matches(TARGETS))
    const stagger = Math.min(Math.max(0, siblings.indexOf(element)), 3) * 65
    const explicitDelay = Number(element.dataset.scrollRevealDelay)
    element.style.setProperty('--scroll-reveal-delay', (Number.isFinite(explicitDelay) ? Math.min(explicitDelay * 1000, 240) : stagger) + 'ms')
    element.dataset.scrollRevealState = 'pending'
    element.classList.add('scroll-reveal-pending')
    observer.observe(element)
  }

  const scan = (node) => {
    if (!(node instanceof HTMLElement) || node.closest(EXCLUDED)) return
    if (node.matches(TARGETS)) register(node)
    node.querySelectorAll(TARGETS).forEach(register)
  }

  const mutations = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof HTMLElement && !node.closest(EXCLUDED)) queue.add(node)
      }
    }
    if (frame !== null || !queue.size) return
    frame = window.requestAnimationFrame(() => {
      frame = null
      if (disposed) return
      // Avoid keeping detached product cards after filtering or route updates.
      for (const element of tracked) {
        if (!element.isConnected) { observer.unobserve(element); tracked.delete(element) }
      }
      queue.forEach((node) => { if (node.isConnected) scan(node) })
      queue.clear()
    })
  })

  const onAnimationEnd = (event) => {
    if (event.animationName === 'content-rise-in' && tracked.has(event.target)) finish(event.target)
  }
  const onFocus = (event) => {
    const element = event.target.closest?.('[data-scroll-reveal-state]')
    if (element && tracked.has(element)) finish(element)
  }
  const onLoad = (event) => {
    if (event.target instanceof HTMLImageElement) scan(event.target)
  }
  const cleanup = () => {
    if (disposed) return
    disposed = true
    observer.disconnect()
    mutations.disconnect()
    if (frame !== null) window.cancelAnimationFrame(frame)
    root.removeEventListener('animationend', onAnimationEnd)
    root.removeEventListener('focusin', onFocus)
    root.removeEventListener('load', onLoad, true)
    preference.removeEventListener('change', cleanup)
    for (const element of tracked) {
      element.classList.remove('scroll-reveal-pending', 'scroll-reveal-entering')
      element.style.removeProperty('--scroll-reveal-delay')
      delete element.dataset.scrollRevealState
    }
    tracked.clear()
    queue.clear()
  }

  scan(root)
  mutations.observe(root, { childList: true, subtree: true })
  root.addEventListener('animationend', onAnimationEnd)
  root.addEventListener('focusin', onFocus)
  root.addEventListener('load', onLoad, true)
  preference.addEventListener('change', cleanup)
  return cleanup
}
