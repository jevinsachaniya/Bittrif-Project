import { Link } from 'react-router-dom'
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react'
import Logo from './Logo'

const links = [
  { label: 'Hotel amenities', to: '/products' },
  { label: 'Housekeeping supplies', to: '/products' },
  { label: 'About Bittrif', to: '/about' },
  { label: 'Request a quote', to: '/contact' },
  { label: 'Contact us', to: '/contact' },
]

const service = ['Hotels and resorts', 'Housekeeping teams', 'Restaurants and kitchens', 'Hospitals and facilities']

export default function Footer() {
  return (
    <footer className="mt-16 bg-brand-950 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="grid gap-6 border-b border-white/10 py-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-200">Stock the details</p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl font-bold tracking-[-0.045em]">Clean standards. Considered stays.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/65">Need a reliable supply partner for a property, kitchen, or facility? Send your list and our team will help you build the order.</p>
          </div>
          <a href="mailto:procurement@bittrifgroup.com?subject=Bulk%20Supply%20Enquiry" className="inline-flex items-center justify-between rounded-2xl bg-brand-400 px-5 py-4 font-semibold text-brand-950 transition-transform hover:-translate-y-0.5">
            <span>Start a supply conversation</span>
            <ArrowUpRight size={18} />
          </a>
        </section>

        <section className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo white size="md" />
            <p className="mt-5 max-w-xs text-sm leading-7 text-white/60">Cleaning systems and hotel essentials for teams that care about every last detail.</p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-brand-200">Shop</h3>
            <div className="mt-5 grid gap-3">
              {links.map((link) => <Link key={link.label} to={link.to} className="text-sm text-white/70 hover:text-white">{link.label}</Link>)}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-brand-200">Who we support</h3>
            <div className="mt-5 grid gap-3">
              {service.map((item) => <span key={item} className="text-sm text-white/70">{item}</span>)}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-brand-200">Contact</h3>
            <div className="mt-5 grid gap-4 text-sm text-white/70">
              <a href="tel:+919876543210" className="flex items-center gap-3 hover:text-white"><Phone size={16} className="text-brand-200" />+91 98765 43210</a>
              <a href="mailto:procurement@bittrifgroup.com" className="flex items-center gap-3 hover:text-white"><Mail size={16} className="text-brand-200" />procurement@bittrifgroup.com</a>
              <span className="flex items-start gap-3"><MapPin size={16} className="mt-0.5 shrink-0 text-brand-200" />Mumbai, Maharashtra, India</span>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-2 border-t border-white/10 py-5 text-xs text-white/45 sm:flex-row sm:justify-between">
          <span>Copyright {new Date().getFullYear()} Bittrif Group of Company. All rights reserved.</span>
          <span>GST-ready billing and delivery support</span>
        </div>
      </div>
    </footer>
  )
}
