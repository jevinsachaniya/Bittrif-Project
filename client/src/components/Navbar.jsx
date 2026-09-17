import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowUpRight, Menu, Package, Phone, ShoppingBag, User, X } from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'

const links = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Shop' },
  { to: '/about', label: 'Our story' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const { user } = useAuth()
  const { totalItems } = useCart()
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="sticky top-0 z-50 border-b border-brand-100 bg-white/95 backdrop-blur-xl">
      <div className="bg-brand-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] sm:px-6 lg:px-8">
          <span>Thoughtful finds for everyday living</span>
          <a href="tel:+917228041690" className="hidden items-center gap-2 text-brand-100 hover:text-white sm:inline-flex"><Phone size={12} />+91 72280 41690</a>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[74px] items-center justify-between gap-4">
          <Link to="/" onClick={closeMenu} className="shrink-0"><Logo /></Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {links.map((link) => <Link key={link.to} to={link.to} className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${pathname === link.to ? 'bg-brand-950 text-white' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-900'}`}>{link.label}</Link>)}
          </nav>
          <div className="flex items-center gap-2">
            <a href="tel:+917228041690" className="hidden h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-brand-900 hover:bg-brand-50 xl:inline-flex"><Phone size={16} />Call us</a>
            <Link to="/cart" className="relative grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-brand-900 hover:bg-brand-100" aria-label="Cart"><ShoppingBag size={19} />{totalItems > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">{totalItems}</span>}</Link>
            <Link to={user ? '/my-orders' : '/login'} className="hidden h-11 items-center gap-2 rounded-full border border-brand-100 px-4 text-sm font-semibold text-brand-900 hover:bg-brand-50 sm:inline-flex">{user ? <><Package size={16} />My orders</> : <><User size={16} />Login</>}</Link>
            <Link to="/contact" className="btn-primary hidden gap-2 md:inline-flex">Say hello <ArrowUpRight size={16} /></Link>
            <button onClick={() => setMenuOpen((value) => !value)} className="grid h-11 w-11 place-items-center rounded-full border border-brand-100 text-brand-900 lg:hidden" aria-label="Toggle navigation" aria-expanded={menuOpen}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
      </div>
      {menuOpen && <div className="border-t border-brand-100 bg-white p-4 lg:hidden"><nav className="mx-auto grid max-w-7xl gap-2" aria-label="Mobile navigation">{links.map((link) => <Link key={link.to} to={link.to} onClick={closeMenu} className={`rounded-xl px-4 py-3 text-sm font-semibold ${pathname === link.to ? 'bg-brand-950 text-white' : 'bg-brand-50 text-slate-700'}`}>{link.label}</Link>)}<Link to="/cart" onClick={closeMenu} className="rounded-xl border border-brand-100 px-4 py-3 text-sm font-semibold text-brand-900">Cart ({totalItems})</Link><Link to={user ? '/my-orders' : '/login'} onClick={closeMenu} className="rounded-xl border border-brand-100 px-4 py-3 text-sm font-semibold text-brand-900">{user ? 'My orders' : 'Login to shop'}</Link><Link to="/contact" onClick={closeMenu} className="rounded-xl bg-brand-950 px-4 py-3 text-center text-sm font-semibold text-white">Get in touch</Link></nav></div>}
    </header>
  )
}
