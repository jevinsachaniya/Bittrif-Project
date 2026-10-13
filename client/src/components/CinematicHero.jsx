import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import { ArrowDown, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Leaf, Pause, Play, Search } from 'lucide-react'
import { Reveal } from './SiteExperience'

const SCENE_DURATION_MS = 3000

const scenes = [
  { label: 'The hospitality edit', title: 'Thoughtful details.', accent: 'Exceptional stays.', description: 'From a warm welcome to the smallest finishing touch. Discover amenities and everyday essentials that make people feel cared for.', image: '/product-images/hotel-amenities.png', collection: 'Hotel amenities', search: 'amenities' },
  { label: 'Spaces with a little soul', title: 'Welcome to comfort.', accent: 'Make it memorable.', description: 'Considered pieces for inviting spaces. Bring a little more warmth, ease, and personality to every room.', image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&q=85', collection: 'Home & living', search: 'home' },
  { label: 'Everyday, elevated', title: 'Small moments.', accent: 'Beautiful rituals.', description: 'Useful essentials. Thoughtful gifts. Find the little things that turn an ordinary routine into something worth looking forward to.', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1600&q=85', collection: 'Everyday essentials', search: 'essentials' },
  { label: 'Made for a warm welcome', title: 'Arrive. Unwind.', accent: 'Feel at home.', description: 'Set the scene for a relaxing stay with thoughtful amenities, inviting spaces, and all the little comforts that matter.', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=85', collection: 'Guest comforts', search: 'hotel' },
  { label: 'A moment of calm', title: 'Refresh your space.', accent: 'Restore your day.', description: 'Bring a considered touch to your bathroom with practical essentials for fresh starts and slower evenings.', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1600&q=85', collection: 'Bathroom essentials', search: 'bathroom' },
  { label: 'The thoughtful home', title: 'Simple pleasures.', accent: 'Lasting impressions.', description: 'Discover useful pieces with character. Small additions that make everyday spaces feel a little more personal.', image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=1600&q=85', collection: 'Thoughtful gifting', search: 'gift' },
  { label: 'Room for the everyday', title: 'Settle into comfort.', accent: 'Stay a little longer.', description: 'Warm textures, easy routines, and considered essentials. Make room for the moments that help you feel your best.', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&q=85', collection: 'Living essentials', search: 'living' },
]

export default function CinematicHero() {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const heroRef = useRef(null)
  const [activeScene, setActiveScene] = useState(0)
  const [paused, setPaused] = useState(false)
  const [inView, setInView] = useState(true)
  const [tabVisible, setTabVisible] = useState(true)
  const [focused, setFocused] = useState(false)
  const [search, setSearch] = useState('')
  const running = !paused && !reducedMotion && inView && tabVisible && !focused
  const scene = scenes[activeScene]

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.1 })
    if (heroRef.current) observer.observe(heroRef.current)
    const updateVisibility = () => setTabVisible(!document.hidden)
    updateVisibility()
    document.addEventListener('visibilitychange', updateVisibility)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', updateVisibility) }
  }, [])

  useEffect(() => {
    if (!running) return
    const timer = window.setTimeout(() => setActiveScene((current) => (current + 1) % scenes.length), SCENE_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [running, activeScene])

  const chooseScene = (index) => {
    setActiveScene((index + scenes.length) % scenes.length)
  }

  return <section ref={heroRef} style={{ '--scene-duration': SCENE_DURATION_MS + 'ms' }} className={'cinematic-hero ' + (running ? 'is-playing' : 'is-paused')} aria-label="The Nivora collections" aria-roledescription="carousel" onFocusCapture={(event) => setFocused(event.target.tagName === 'INPUT')} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }}>
    <div className="cinematic-backdrop" aria-hidden="true">
      {scenes.map((item, index) => <div key={item.image} className={'cinematic-scene ' + (activeScene === index ? 'is-active' : '')}><img className="cinematic-scene-image" src={item.image} alt="" fetchPriority={index === 0 ? 'high' : 'low'} loading={index === 0 ? 'eager' : 'lazy'} onError={(event) => { if (!event.currentTarget.src.endsWith('/product-images/hotel-amenities.png')) event.currentTarget.src = '/product-images/hotel-amenities.png' }} /></div>)}
    </div>
    <div className="cinematic-shade" aria-hidden="true" />
    <div className="cinematic-light cinematic-light-one" aria-hidden="true" />
    <div className="cinematic-light cinematic-light-two" aria-hidden="true" />
    <div className="cinematic-dust" aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <span key={index} style={{ '--particle-x': (index * 13 + 7) % 100 + '%', '--particle-delay': -index * 2.7 + 's', '--particle-duration': 14 + index * 1.4 + 's' }} />)}</div>

    <div className="cinematic-content">
      <div className="cinematic-eyebrow"><span /> Nivora / A considered collection</div>
      <div key={activeScene} className="cinematic-copy" aria-live={paused ? 'polite' : 'off'}>
        <p className="cinematic-edition">{scene.label}</p>
        <h1>{scene.title}<br /><em>{scene.accent}</em></h1>
        <p className="cinematic-description">{scene.description}</p>
      </div>
      <Reveal delay={0.15}><div className="cinematic-actions"><Link to="/products" className="btn-gold gap-3 px-7 py-3.5">Explore the collection <ArrowUpRight size={18} /></Link><Link to="/contact" className="cinematic-enquiry">Let’s find your perfect fit <ArrowRight size={17} /></Link></div></Reveal>
      <form className="cinematic-search" role="search" onSubmit={(event) => { event.preventDefault(); navigate('/products?search=' + encodeURIComponent(search.trim())) }}><Search size={17} aria-hidden="true" /><input aria-label="Search products" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="What can we help you find?" /><button type="submit" aria-label="Search the collection"><ArrowRight size={19} /></button></form>
      <div className="cinematic-signature"><Leaf size={16} strokeWidth={1.4} /><span>Considered essentials. A warmer welcome.</span></div>
    </div>

    <div className="cinematic-side-note" aria-hidden="true"><span>THE ART OF FEELING AT HOME</span><i /></div>
    <div className="cinematic-bottom">
      <a className="cinematic-discover" href="#discover"><span><ArrowDown size={17} /></span>Discover the details</a>
      <Link to={'/products?search=' + scene.search} className="cinematic-collection-link"><span>IN THE SPOTLIGHT</span><strong>{scene.collection} <ArrowUpRight size={17} /></strong></Link>
      <div className="cinematic-controls">
        <button className="cinematic-control" onClick={() => chooseScene(activeScene - 1)} aria-label="Previous collection"><ChevronLeft size={19} /></button>
        <div className="cinematic-scene-select" aria-label="Choose a collection">{scenes.map((item, index) => <button key={item.label} onClick={() => chooseScene(index)} aria-label={'Show ' + item.collection} aria-pressed={activeScene === index} className={activeScene === index ? 'active' : ''}><span>0{index + 1}</span><i><b key={String(activeScene) + String(running)} /></i></button>)}</div>
        <button className="cinematic-control" onClick={() => chooseScene(activeScene + 1)} aria-label="Next collection"><ChevronRight size={19} /></button>
        <button className="cinematic-control cinematic-pause" disabled={Boolean(reducedMotion)} onClick={() => { setPaused((value) => !value); setFocused(false) }} aria-label={reducedMotion ? 'Background motion disabled by your device preference' : paused ? 'Play background animation' : 'Pause background animation'} title={reducedMotion ? 'Reduced motion is enabled' : paused ? 'Play background animation' : 'Pause background animation'}>{paused || reducedMotion ? <Play size={15} /> : <Pause size={15} />}</button>
      </div>
    </div>
  </section>
}
