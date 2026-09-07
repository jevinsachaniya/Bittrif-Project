import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import {
  ArrowRight,
  Building2,
  CheckCircle,
  CreditCard,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Truck,
  User,
} from 'lucide-react'
import { API, formatPrice } from '../lib/utils'

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'delivered']

function formatLabel(value) {
  if (!value) return 'Not provided'
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function OrderSuccess() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const itemSubtotal = order?.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0

  useEffect(() => {
    axios.get(`${API}/orders/${id}`).then((response) => setOrder(response.data))
  }, [id])

  return (
    <div className="page-shell">
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,_#102947,_#1e73c2)] text-white">
        <div className="texture-overlay absolute inset-0 opacity-20" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/10">
            <CheckCircle size={48} />
          </div>
          <p className="section-kicker mt-8 text-gold-400">Order received</p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-white md:text-5xl">
            Your Bittrif order has been placed.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-200">
            We have your cart, delivery details, and business preferences. Your team can now track this order from the
            account area while Bittrif follows up on the next steps.
          </p>
          {order ? (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold">
              <Package size={16} />
              Order #{order.id}
            </div>
          ) : null}
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="surface-panel p-6">
          <h2 className="font-display text-2xl font-semibold text-slate-950">Order progress</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            {STATUS_STEPS.map((step, index) => (
              <div key={step} className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4 text-center">
                <div
                  className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                    index === 0 ? 'bg-brand-700 text-white' : 'bg-white text-slate-500'
                  }`}
                >
                  {index === 0 ? <CheckCircle size={16} /> : index + 1}
                </div>
                <p className={`mt-3 text-sm font-semibold capitalize ${index === 0 ? 'text-brand-800' : 'text-slate-500'}`}>
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>

        {order ? (
          <div className="mt-6 space-y-6">
            <div className="surface-panel p-6">
              <h2 className="font-display text-2xl font-semibold text-slate-950">Contact and delivery details</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl bg-slate-50/80 p-4">
                  <div className="inline-flex items-center gap-3 text-sm font-semibold text-slate-900">
                    <UserIcon />
                    Primary contact
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{order.customer_name}</p>
                  <p className="mt-1 text-sm text-slate-600">{order.customer_phone || 'No phone provided'}</p>
                  <p className="mt-1 text-sm text-slate-600">{order.customer_email}</p>
                </div>

                <div className="rounded-3xl bg-slate-50/80 p-4">
                  <div className="inline-flex items-center gap-3 text-sm font-semibold text-slate-900">
                    <MapPin size={16} className="text-brand-700" />
                    Delivery address
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {order.address}
                    {order.landmark ? `, ${order.landmark}` : ''}
                    {order.city ? `, ${order.city}` : ''}
                    {order.state ? `, ${order.state}` : ''}
                    {order.pincode ? ` ${order.pincode}` : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="surface-panel p-6">
                <h2 className="font-display text-2xl font-semibold text-slate-950">Items ordered</h2>
                <div className="mt-5 space-y-3">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 rounded-3xl bg-slate-50/80 p-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{item.product_name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Qty {item.quantity} x {formatPrice(item.price)}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-slate-950">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 space-y-2 border-t border-dashed border-slate-200 pt-4 text-sm text-slate-600">
                  <div className="flex items-center justify-between"><span>Items subtotal</span><span>{formatPrice(itemSubtotal)}</span></div>
                  <div className="flex items-center justify-between"><span>Shipping</span><span>{order.shipping_amount ? formatPrice(order.shipping_amount) : 'Free'}</span></div>
                  <div className="flex items-center justify-between pt-2 text-lg font-bold text-slate-950"><span>Total</span><span>{formatPrice(order.total)}</span></div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="surface-panel p-6">
                  <h2 className="font-display text-2xl font-semibold text-slate-950">Business details</h2>
                  <div className="mt-5 grid gap-4 text-sm text-slate-600">
                    <InfoRow icon={<Building2 size={16} className="text-brand-700" />} label="Company" value={order.company_name || 'Not provided'} />
                    <InfoRow icon={<FileText size={16} className="text-brand-700" />} label="GSTIN" value={order.gstin || 'Not provided'} />
                    <InfoRow icon={<Truck size={16} className="text-brand-700" />} label="Delivery type" value={formatLabel(order.delivery_type)} />
                    <InfoRow icon={<Truck size={16} className="text-brand-700" />} label="Preferred slot" value={formatLabel(order.preferred_slot)} />
                    <InfoRow icon={<CreditCard size={16} className="text-brand-700" />} label="Payment method" value={formatLabel(order.payment_method)} />
                    <InfoRow icon={<FileText size={16} className="text-brand-700" />} label="Invoice type" value={formatLabel(order.invoice_type)} />
                  </div>
                </div>

                {order.order_notes ? (
                  <div className="surface-panel p-6">
                    <h2 className="font-display text-2xl font-semibold text-slate-950">Order notes</h2>
                    <div className="mt-4 inline-flex items-start gap-3 text-sm leading-7 text-slate-600">
                      <MessageSquare size={16} className="mt-1 shrink-0 text-brand-700" />
                      {order.order_notes}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/" className="btn-primary gap-2">
            Continue shopping
            <ArrowRight size={16} />
          </Link>
          <Link to="/my-orders" className="btn-outline">
            View my orders
          </Link>
          <a href="tel:+919876543210" className="btn-outline gap-2">
            <Phone size={16} />
            Call support
          </a>
          <a href="mailto:procurement@bittrifgroup.com" className="btn-outline gap-2">
            <Mail size={16} />
            Email support
          </a>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-3xl bg-slate-50/80 p-4">
      <span className="rounded-2xl bg-white p-2">{icon}</span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <p className="mt-1 font-medium text-slate-900">{value}</p>
      </div>
    </div>
  )
}

function UserIcon() {
  return <User size={16} className="text-brand-700" />
}
