import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, LogOut, Menu, Package, Search, ShoppingBag, User, X } from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'

const links = [{ to: '/', label: 'Home' }, { to: '/products', label: 'The collection' }, { to: '/about', label: 'Our story' }, { to: '/contact', label: 'Get in touch' }]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { totalItems } = useCart()
  const menuButton = useRef(null)
  const closeMenu = () => setMenuOpen(false)
  const handleLogout = () => {
    logout()
    closeMenu()
    navigate('/', { replace: true })
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  return <header className={'site-header sticky top-0 z-50 border-b border-brand-100 bg-[#faf9f6]/95 backdrop-blur-xl ' + (scrolled ? 'is-scrolled' : '')}>
    <a href="#main-content" className="skip-link">Skip to content</a>
    <div className="bg-brand-950 text-white"><div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-1.5 text-[10px] tracking-[0.08em]"><span>A little more joy in the everyday.</span><Link to="/products" onClick={closeMenu} className="inline-flex items-center gap-1 text-brand-200">Discover the edit <ArrowUpRight size={12} /></Link></div></div>
    <div className="mx-auto flex h-[64px] max-w-7xl items-center justify-between gap-3 px-5 sm:px-6 lg:px-8">
      <Link to="/" onClick={closeMenu} className="shrink-0" aria-label="Nivora home"><Logo /></Link>
      <nav className="hidden items-center gap-2 lg:flex" aria-label="Main navigation">{links.map((link) => {
        const active = link.to === '/' ? pathname === '/' : pathname.startsWith(link.to)
        return <Link key={link.to} to={link.to} aria-current={active ? 'page' : undefined} className={'nav-link ' + (active ? 'active' : '')}>{link.label}{active && <motion.span layoutId="navigation-underline" className="nav-indicator" transition={{ type: 'spring', stiffness: 360, damping: 32 }} />}</Link>
      })}</nav>
      <div className="flex items-center gap-1 sm:gap-2">
        <Link to="/products" onClick={closeMenu} className="nav-icon hidden sm:grid" aria-label="Search the collection"><Search size={19} strokeWidth={1.5} /></Link>
        <Link to={user ? '/my-orders' : '/login'} onClick={closeMenu} className="nav-icon" aria-label={user ? 'My orders' : 'Login'}>{user ? <Package size={19} strokeWidth={1.5} /> : <User size={19} strokeWidth={1.5} />}</Link>
        {user && <button type="button" onClick={handleLogout} className="hidden min-h-11 items-center gap-2 rounded-full border border-brand-200 px-4 text-xs font-semibold text-brand-800 hover:bg-brand-100 lg:inline-flex"><LogOut size={16} strokeWidth={1.5} />Log out</button>}
        <Link to="/cart" onClick={closeMenu} className="nav-icon relative" aria-label={'Shopping bag, ' + totalItems + ' items'}><ShoppingBag size={19} strokeWidth={1.5} />{totalItems > 0 && <motion.span key={totalItems} initial={{ scale: .65 }} animate={{ scale: 1 }} className="absolute -right-0.5 top-0 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand-700 px-1 text-[9px] font-bold text-white">{totalItems}</motion.span>}</Link>
        <button ref={menuButton} onClick={() => setMenuOpen((value) => !value)} className="nav-icon lg:hidden" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="mobile-navigation">{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
      </div>
    </div>
    <AnimatePresence>{menuOpen && <motion.div id="mobile-navigation" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .25 }} className="overflow-hidden border-t border-brand-100 bg-[#faf9f6] lg:hidden"><nav className="grid gap-2 p-5" aria-label="Mobile navigation">{links.map((link) => <Link key={link.to} to={link.to} onClick={closeMenu} aria-current={pathname === link.to ? 'page' : undefined} className={'flex items-center justify-between rounded-xl px-4 py-3 text-sm ' + (pathname === link.to ? 'bg-brand-950 text-white' : 'bg-brand-50 text-brand-900')}>{link.label}<ArrowUpRight size={16} /></Link>)}<Link to="/products" onClick={closeMenu} className="flex items-center gap-2 px-4 py-3 text-sm text-brand-800"><Search size={16} />Search products</Link>
      <Link to={user ? '/my-orders' : '/login'} onClick={closeMenu} className="flex items-center gap-2 px-4 py-3 text-sm text-brand-800">{user ? <Package size={16} /> : <User size={16} />}{user ? 'My orders' : 'Login'}</Link>
      {user && <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl border border-brand-200 px-4 py-3 text-left text-sm font-semibold text-brand-800 hover:bg-brand-100"><LogOut size={16} />Log out</button>}
    </nav></motion.div>}</AnimatePresence>
  </header>
}
