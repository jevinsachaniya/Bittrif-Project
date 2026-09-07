import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { ChevronRight, LayoutDashboard, LogOut, Menu, Package, ShoppingBag, Store, X } from 'lucide-react'
import Logo from '../../components/Logo'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/products', label: 'Products', icon: Package },
]

const pageTitles = {
  '/admin': 'Dashboard',
  '/admin/orders': 'Orders',
  '/admin/products': 'Products',
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-[#f3f9fd] lg:flex">
      {sidebarOpen && <button className="fixed inset-0 z-40 bg-brand-950/55 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[278px] flex-col overflow-hidden bg-brand-950 text-white shadow-2xl shadow-brand-950/30 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="pointer-events-none absolute -right-20 -top-16 h-56 w-56 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-12 h-52 w-52 rounded-full border border-brand-300/15" />

        <div className="relative flex items-start justify-between border-b border-white/10 px-6 py-6">
          <div>
            <Logo white size="sm" />
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-brand-300/20 bg-brand-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-100">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-300" /> Operations portal
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white lg:hidden" aria-label="Close navigation">
            <X size={19} />
          </button>
        </div>

        <nav className="relative flex-1 px-4 py-7">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-200/60">Workspace</p>
          <div className="space-y-1.5">
            {navItems.map(({ to, label, icon: Icon, exact }) => {
              const active = exact ? pathname === to : pathname.startsWith(to)
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${active ? 'bg-white text-brand-950 shadow-lg shadow-black/15' : 'text-brand-100/70 hover:bg-white/10 hover:text-white'}`}
                >
                  <Icon size={18} className={active ? 'text-brand-600' : 'text-brand-200/70 group-hover:text-brand-100'} />
                  <span>{label}</span>
                  {active && <ChevronRight size={15} className="ml-auto text-brand-500" />}
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="relative m-4 rounded-2xl border border-white/10 bg-white/[0.06] p-2">
          <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-brand-100/75 transition-colors hover:bg-white/10 hover:text-white">
            <Store size={17} /> View storefront
          </Link>
          <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-brand-100/55 transition-colors hover:bg-white/10 hover:text-white">
            <LogOut size={17} /> Exit admin
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-brand-100/80 bg-white/90 px-4 backdrop-blur-xl sm:px-7">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="rounded-xl border border-brand-100 bg-brand-50 p-2 text-brand-800 transition-colors hover:bg-brand-100 lg:hidden" aria-label="Open navigation">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="hidden font-medium text-slate-400 sm:inline">Operations</span>
              <ChevronRight size={14} className="hidden text-slate-300 sm:inline" />
              <span className="font-bold text-slate-800">{pageTitles[pathname] || 'Admin'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 py-1.5 pl-2 pr-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-700 text-xs font-bold text-white">A</span>
            <span className="text-sm font-semibold text-brand-950">Admin</span>
          </div>
        </header>

        <main className="min-h-[calc(100vh-76px)] bg-[radial-gradient(circle_at_100%_0%,rgba(134,213,255,0.3),transparent_28rem)] p-4 sm:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
