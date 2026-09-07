import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { BadgeCheck, ChevronDown, ChevronUp, Clock3, Package, PackageCheck, Truck, XCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { API, formatPrice } from '../lib/utils'

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'delivered']
const STATUS_META = {
  pending: { label: 'Request received', color: 'bg-amber-50 text-amber-800', icon: Clock3 },
  processing: { label: 'Being prepared', color: 'bg-brand-50 text-brand-800', icon: Package },
  shipped: { label: 'On the way', color: 'bg-violet-50 text-violet-700', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-emerald-50 text-emerald-700', icon: PackageCheck },
  cancelled: { label: 'Cancelled', color: 'bg-rose-50 text-rose-700', icon: XCircle },
}

function OrderCard({ order }) {
  const [open, setOpen] = useState(false)
  const meta = STATUS_META[order.status] || STATUS_META.pending
  const Icon = meta.icon
  const stepIndex = STATUS_STEPS.indexOf(order.status)

  return <article className="surface-panel overflow-hidden"><button onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left hover:bg-slate-50/70 sm:px-6"><div className="flex min-w-0 items-center gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-800"><Package size={21} /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-display text-lg font-bold text-slate-900">Order #{order.id}</p><span className={`badge gap-1.5 ${meta.color}`}><Icon size={13} />{meta.label}</span></div><p className="mt-1 text-xs text-slate-500">Placed {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div></div><div className="flex shrink-0 items-center gap-3"><span className="hidden font-bold text-brand-800 sm:block">{formatPrice(order.total)}</span>{open ? <ChevronUp size={19} className="text-slate-400" /> : <ChevronDown size={19} className="text-slate-400" />}</div></button>{open && <div className="border-t border-slate-100 px-5 pb-6 pt-5 sm:px-6"><div className="relative grid grid-cols-4 gap-2"><div className="absolute left-[12%] right-[12%] top-4 h-0.5 bg-slate-200" />{STATUS_STEPS.map((step, index) => { const complete = index <= stepIndex; return <div key={step} className="relative z-10 text-center"><span className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 ${complete ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-200 bg-white text-slate-400'}`}>{complete ? <BadgeCheck size={15} /> : index + 1}</span><p className={`mt-2 text-[10px] font-bold uppercase tracking-wide ${complete ? 'text-brand-800' : 'text-slate-400'}`}>{step}</p></div>})}</div><div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.8fr]"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Items in this order</p><div className="mt-3 grid gap-2">{order.items?.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm"><span className="font-semibold text-slate-700">{item.product_name} <span className="font-normal text-slate-400">x {item.quantity}</span></span><span className="shrink-0 font-bold text-slate-900">{formatPrice(item.price * item.quantity)}</span></div>)}</div></div><div className="rounded-2xl bg-brand-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Delivery details</p><p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{order.address}{order.city ? `, ${order.city}` : ''}{order.pincode ? ` - ${order.pincode}` : ''}</p>{order.company_name && <p className="mt-3 text-xs text-slate-500">Ordered for {order.company_name}</p>}<p className="mt-4 font-display text-xl font-bold text-brand-950">{formatPrice(order.total)}</p></div></div></div>}</article>
}

export default function MyOrders() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login?redirect=/my-orders'); return }
    axios.get(`${API}/my-orders`, { params: { email: user.email } }).then((response) => setOrders(response.data)).finally(() => setLoading(false))
  }, [user, navigate])

  return <div className="page-shell"><section className="bg-brand-950"><div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6"><p className="section-kicker text-gold-400">Your supply desk</p><h1 className="mt-3 font-display text-4xl font-bold text-white">Orders and delivery progress.</h1><p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-200">Keep track of your product requests and see where each order is in the supply process.</p>{user && <p className="mt-5 text-xs font-semibold text-brand-200">Signed in as {user.email}</p>}</div></section><main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">{loading ? <div className="grid gap-4">{[1, 2, 3].map((number) => <div key={number} className="skeleton h-28 rounded-3xl" />)}</div> : orders.length === 0 ? <div className="surface-panel p-12 text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-50 text-brand-800"><Package size={28} /></span><h2 className="mt-6 font-display text-2xl font-bold text-slate-900">Your order list is clear.</h2><p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-600">Browse cleaning and hotel amenity supplies, then build an order request with your delivery and business details.</p><Link to="/products" className="btn-primary mt-7">Browse catalog</Link></div> : <div className="space-y-4">{orders.map((order) => <OrderCard key={order.id} order={order} />)}</div>}</main></div>
}
