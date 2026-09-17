import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { ArrowUpRight, Check, Gift, Heart, PackageCheck, Search, Sparkles, Truck } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { API } from '../lib/utils'

const categoryImages = [
  'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=900&q=80',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=900&q=80',
  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=900&q=80',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&q=80',
]

export default function Home() {
  const [categories, setCategories] = useState([])
  const [featured, setFeatured] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    axios.get(`${API}/categories`).then((response) => setCategories(response.data)).catch(() => {})
    axios.get(`${API}/products?featured=true`).then((response) => setFeatured(response.data)).catch(() => {})
  }, [])

  return (
    <div className="page-shell">
      <section className="relative overflow-hidden bg-brand-950">
        <img src="https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=1800&q=85" alt="Warm, thoughtfully arranged home" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-950/90 to-brand-900/35" />
        <div className="relative mx-auto grid min-h-[590px] max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-200/30 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-100"><Sparkles size={14} /> Nivora everyday market</p>
            <h1 className="mt-6 max-w-3xl font-display text-5xl font-bold leading-[1.03] tracking-[-0.055em] text-white md:text-6xl">Small finds for a more beautiful everyday.</h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-white/75">A considered collection of home, travel, wellness, and gifting essentials chosen for the rituals that make life feel good.</p>
            <div className="mt-8 flex max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl"><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && (window.location.href = `/products?search=${encodeURIComponent(search)}`)} placeholder="Search for something useful..." className="min-w-0 flex-1 px-5 py-4 text-sm text-slate-900 outline-none" /><Link to={`/products?search=${encodeURIComponent(search)}`} className="grid w-14 place-items-center bg-brand-600 text-white hover:bg-brand-700" aria-label="Search products"><Search size={20} /></Link></div>
            <div className="mt-7 flex flex-wrap gap-3"><Link to="/products" className="btn-primary gap-2">Shop the edit <ArrowUpRight size={16} /></Link><Link to="/about" className="btn-outline border-white/30 bg-white/10 text-white hover:bg-white/20">Meet Nivora</Link></div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/80">{['Useful by design', 'Easy, secure ordering', 'Made for everyday gifting'].map((item) => <span key={item} className="inline-flex items-center gap-2"><Check size={16} className="text-gold-400" />{item}</span>)}</div>
          </div>
          <div className="hidden lg:block"><div className="ml-auto max-w-sm rounded-2xl border border-white/15 bg-white/[0.1] p-5 backdrop-blur"><img src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=700&q=85" alt="Nivora home collection" className="h-56 w-full rounded-xl object-cover" /><div className="mt-5 grid gap-3">{[[Heart, 'Thoughtfully picked', 'Every item earns a place in your routine.'], [Gift, 'Ready to gift', 'Useful finds for people you care about.'], [Truck, 'Order with ease', 'Simple checkout and helpful support.']].map(([Icon, title, text]) => <div key={title} className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-brand-100"><Icon size={18} /></span><div><p className="text-sm font-bold text-white">{title}</p><p className="mt-1 text-xs leading-5 text-white/60">{text}</p></div></div>)}</div></div></div>
        </div>
      </section>

      <section className="border-b border-brand-100 bg-white"><div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:grid-cols-3 sm:px-6 lg:px-8">{[[Heart, 'Chosen with care', 'Practical, pleasing essentials for real routines.'], [PackageCheck, 'Easy ordering', 'Clear product details and secure checkout.'], [Gift, 'A lovely gift', 'Useful little upgrades for someone special.']].map(([Icon, title, text]) => <div key={title} className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-brand-800"><Icon size={20} /></span><div><p className="text-sm font-bold text-slate-900">{title}</p><p className="mt-0.5 text-xs leading-5 text-slate-500">{text}</p></div></div>)}</div></section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><div className="flex items-end justify-between gap-5"><div><p className="section-kicker">Browse the edit</p><h2 className="mt-3 section-title">Find your everyday favourites.</h2></div><Link to="/products" className="hidden text-sm font-bold text-brand-800 sm:inline-flex">Shop everything <ArrowUpRight size={15} className="ml-1" /></Link></div><div className="mt-9 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{categories.slice(0, 8).map((category, index) => <Link key={category.id} to={`/products?category=${category.id}`} className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-brand-950"><img src={categoryImages[index % categoryImages.length]} alt={category.name} className="h-full w-full object-cover opacity-75 transition duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/20 to-transparent" /><div className="absolute bottom-0 p-4"><p className="text-sm font-bold text-white">{category.name}</p><span className="mt-2 inline-flex items-center text-xs font-semibold text-brand-100">Explore <ArrowUpRight size={14} className="ml-1" /></span></div></Link>)}</div></section>

      <section className="bg-brand-50 py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="flex items-end justify-between gap-5"><div><p className="section-kicker">Nivora favourites</p><h2 className="mt-3 section-title">Popular pieces, picked for you.</h2></div><Link to="/products" className="btn-outline hidden sm:inline-flex">View all</Link></div><div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{featured.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}</div>{!featured.length && <div className="surface-panel mt-8 p-10 text-center text-sm text-slate-500">Products will appear here once the API is running.</div>}</div></section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><div className="grid gap-8 rounded-2xl bg-brand-900 p-8 text-white md:grid-cols-[1.2fr_0.8fr] md:items-center md:p-12"><div><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-200">A little help goes a long way</p><h2 className="mt-3 max-w-2xl font-display text-4xl font-bold tracking-[-0.045em]">Looking for something specific?</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">Tell us what you have in mind. We are happy to help you choose a gift, find an item, or answer an order question.</p></div><div className="flex flex-wrap gap-3 md:justify-end"><Link to="/contact" className="rounded-full bg-white px-5 py-3 font-semibold text-brand-900">Contact Nivora</Link><a href="tel:+917228041690" className="rounded-full border border-white/30 px-5 py-3 font-semibold text-white">Call us</a></div></div></section>
    </div>
  )
}
