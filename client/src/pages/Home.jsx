import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { ArrowUpRight, Gift, Heart, ShieldCheck } from 'lucide-react'
import CinematicHero from '../components/CinematicHero'
import ProductCard from '../components/ProductCard'
import { Reveal } from '../components/SiteExperience'
import { API } from '../lib/utils'

const categoryImages = ['https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=900&q=80', 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80', 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&q=80', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80']

export default function Home() {
  const [categories, setCategories] = useState([])
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      axios.get(API + '/categories', { signal: controller.signal }),
      axios.get(API + '/products?featured=true', { signal: controller.signal }),
    ]).then(([categoryResponse, productResponse]) => {
      setCategories(categoryResponse.data)
      setFeatured(productResponse.data)
    }).catch((requestError) => { if (!axios.isCancel(requestError)) setError(true) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [retry])

  const shownProducts = featured.filter((product) => activeCategory === 'all' || String(product.category_id) === activeCategory).slice(0, 4)
  const featuredCategories = categories.filter((category) => featured.some((product) => String(product.category_id) === String(category.id)))

  return <div className="page-shell home-page">
    <CinematicHero />

    <section className="promise-strip"><div className="mx-auto grid max-w-7xl gap-5 px-6 py-6 sm:grid-cols-3 lg:px-8">{[[Heart, 'Thoughtfully selected', 'Every piece has a purpose.'], [ShieldCheck, 'Simple, secure shopping', 'An easier way to find your favourites.'], [Gift, 'Little things, lovely gifts', 'Something meaningful for someone special.']].map(([Icon, title, description]) => <div key={title} className="flex items-center gap-4"><Icon size={23} strokeWidth={1.4} className="shrink-0 text-brand-700" /><div><p className="text-sm font-semibold text-brand-950">{title}</p><p className="mt-1 text-xs text-slate-500">{description}</p></div></div>)}</div></section>

    <section id="discover" className="section-space mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
      <Reveal className="section-heading"><div><p className="section-kicker">Consider this your inspiration</p><h2 className="section-title mt-3">A little something for every day.</h2></div><Link to="/products" className="text-link">Explore all <ArrowUpRight size={17} /></Link></Reveal>
      <div className="mt-9 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton aspect-[4/5] rounded-2xl" aria-label="Loading collection" />) : categories.slice(0, 4).map((category, index) => <Reveal key={category.id} delay={index * 0.06}><Link to={'/products?category=' + category.id} className="collection-card group"><img src={categoryImages[index]} alt={category.name} loading="lazy" /><div className="collection-shade" /><span className="collection-number">0{index + 1}</span><div className="collection-caption"><div><p>THE COLLECTION</p><h3>{category.name}</h3></div><span className="collection-arrow"><ArrowUpRight size={21} /></span></div></Link></Reveal>)}
      </div>
    </section>

    <section className="featured-section section-space"><div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
      <Reveal className="section-heading"><div><p className="section-kicker">Meet your new favourites</p><h2 className="section-title mt-3">Good finds. Great company.</h2></div><Link to="/products?featured=1" className="text-link">Shop the edit <ArrowUpRight size={17} /></Link></Reveal>
      <div className="filter-tabs" aria-label="Filter featured products"><button aria-pressed={activeCategory === 'all'} className={activeCategory === 'all' ? 'active' : ''} onClick={() => setActiveCategory('all')}>All favourites</button>{featuredCategories.map((category) => <button key={category.id} aria-pressed={activeCategory === String(category.id)} className={activeCategory === String(category.id) ? 'active' : ''} onClick={() => setActiveCategory(String(category.id))}>{category.name}</button>)}</div>
      {error ? <div className="surface-panel p-10 text-center" role="status"><h3 className="font-display text-2xl">Our collection needs another moment.</h3><p className="my-3 text-sm text-slate-500">We couldn’t load the latest finds. Please try again.</p><button className="btn-primary mt-2" onClick={() => { setLoading(true); setError(false); setRetry((value) => value + 1) }}>Try again</button></div> : loading ? <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton h-96 rounded-2xl" aria-label="Loading product" />)}</div> : shownProducts.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{shownProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <p className="py-12 text-center text-slate-500">New favourites are on their way. <Link to="/products" className="underline">Explore the full collection.</Link></p>}
    </div></section>

    <section className="section-space mx-auto max-w-7xl px-5 sm:px-6 lg:px-8"><Reveal className="story-panel"><div className="story-image"><img src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=1000&q=85" alt="A quiet corner filled with books, plants, and everyday objects" loading="lazy" /><span>A more thoughtful everyday.</span></div><div className="story-copy"><p className="section-kicker">A note from Nivora</p><h2>Less ordinary.<br /><em>More meaningful.</em></h2><p>We believe the best things are the ones you reach for again and again. Useful, beautiful pieces that quietly become part of your everyday.</p><p>That’s the idea behind our little market. A considered collection. A personal touch. A little more joy in the ordinary.</p><Link to="/about" className="text-link mt-7">Get to know us <ArrowUpRight size={17} /></Link></div></Reveal></section>
    <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-6 lg:px-8"><Reveal className="help-banner"><div><p className="section-kicker">Here for the little questions, too</p><h2 className="mt-3 font-display text-3xl sm:text-4xl">Looking for something in particular?</h2><p className="mt-3 text-sm text-brand-100">A gift, a home refresh, or a larger order. Let’s find the right fit.</p></div><Link to="/contact" className="btn-gold shrink-0 gap-3 px-6 py-3.5">Let’s talk <ArrowUpRight size={18} /></Link></Reveal></section>
  </div>
}
