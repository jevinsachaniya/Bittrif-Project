import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle,
  CreditCard,
  FileText,
  Loader,
  LogIn,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Truck,
  User,
} from 'lucide-react'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import { API, formatPrice } from '../lib/utils'

const CHECKOUT_DRAFT_KEY = 'bittrif_checkout_draft'

function getErrorMessage(error) {
  const detail = error.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((issue) => `${issue.loc?.at(-1) || 'Field'}: ${issue.msg || 'Please check this value.'}`).join(' ')
  return 'Failed to place order. Please check the form and try again.'
}

function createInitialForm(user) {
  let savedDraft = {}

  try {
    savedDraft = JSON.parse(localStorage.getItem(CHECKOUT_DRAFT_KEY) || '{}')
  } catch {
    savedDraft = {}
  }

  return {
    customer_phone: '',
    company_name: '',
    gstin: '',
    address: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    delivery_type: 'standard',
    preferred_slot: 'business-hours',
    invoice_type: 'gst',
    payment_method: 'cod',
    order_notes: '',
    ...savedDraft,
    customer_name: savedDraft.customer_name || user?.name || '',
    customer_email: savedDraft.customer_email || user?.email || '',
  }
}

const DELIVERY_TYPES = [
  {
    value: 'standard',
    title: 'Standard dispatch',
    description: 'Best for routine replenishment and planned hotel or facility orders.',
  },
  {
    value: 'priority',
    title: 'Priority handling',
    description: 'Use for urgent supply requests that need faster internal follow-up.',
  },
]

const PAYMENT_OPTIONS = [
  {
    value: 'cod',
    title: 'Cash on delivery',
    description: 'Best for direct deliveries and smaller operational orders.',
  },
  {
    value: 'proforma',
    title: 'Proforma invoice request',
    description: 'Best when your accounts team needs documentation before dispatch.',
  },
]

export default function Checkout() {
  const { cart, totalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(() => createInitialForm(user))

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const shipping = 0
  const total = totalPrice + shipping

  useEffect(() => {
    if (!cart.length) navigate('/cart')
  }, [cart.length, navigate])

  useEffect(() => {
    localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(form))
  }, [form])

  if (!cart.length) return null

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[76vh] max-w-3xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="surface-panel w-full p-10 text-center sm:p-14">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <LogIn size={42} />
          </div>
          <h1 className="mt-8 font-display text-4xl font-bold tracking-tight text-slate-950">Login required</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-slate-600">
            Your cart is safe. Sign in so we can connect this checkout request to your account and let you track it
            after the order is placed.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link to="/login?redirect=/checkout" className="btn-primary justify-center py-3.5">
              Login to continue
            </Link>
            <Link to="/register?redirect=/checkout" className="btn-outline justify-center py-3.5">
              Create account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const updateField = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const requiredMessage = !form.customer_name.trim()
      ? 'Enter the customer name.'
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email.trim())
        ? 'Enter a valid customer email address.'
        : form.address.trim().length < 8
          ? 'Enter a complete delivery address with at least 8 characters.'
          : ''
    if (requiredMessage) {
      setError(requiredMessage)
      return
    }
    const invalidItem = cart.find((item) => item.quantity < (item.minimum_order_quantity || 1) || item.quantity > item.stock)
    if (invalidItem) {
      const minimumQuantity = invalidItem.minimum_order_quantity || 1
      setError(invalidItem.quantity < minimumQuantity ? `${invalidItem.name} requires a minimum order quantity of ${minimumQuantity}.` : `${invalidItem.name} has only ${invalidItem.stock} units available.`)
      return
    }
    setLoading(true)
    setError('')

    try {
      const optionalFields = ['customer_phone', 'company_name', 'gstin', 'landmark', 'city', 'state', 'pincode', 'preferred_slot', 'order_notes']
      const cleanedForm = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, optionalFields.includes(key) && !String(value).trim() ? null : typeof value === 'string' ? value.trim() : value]))
      const payload = {
        ...cleanedForm,
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      }

      const { data } = await axios.post(`${API}/orders`, payload)
      localStorage.removeItem(CHECKOUT_DRAFT_KEY)
      clearCart()
      navigate(`/order-success/${data.orderId}`)
    } catch (submitError) {
      setError(getErrorMessage(submitError))
      setLoading(false)
    }
  }

  return (
    <div className="page-shell">
      <section className="border-b border-slate-200/70 bg-white/85">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="section-kicker">Checkout request</p>
              <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                Share delivery and billing details once, then place the order cleanly.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                This upgraded checkout captures the extra information business buyers usually need: company identity,
                GST invoice preference, delivery type, and notes for operations or accounts teams.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <span className="status-pill">
                  <BadgeCheck size={14} />
                  Draft auto-saves on this device
                </span>
                <span className="status-pill">
                  <BadgeCheck size={14} />
                  Business billing fields included
                </span>
                <span className="status-pill">
                  <BadgeCheck size={14} />
                  Cart summary stays visible
                </span>
              </div>
            </div>

            <div className="surface-panel p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl bg-brand-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Items</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-950">{itemCount}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Subtotal</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-950">{formatPrice(totalPrice)}</p>
                </div>
                <div className="rounded-3xl bg-gold-500/15 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">Order total</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-950">{formatPrice(total)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
                {error}
              </div>
            ) : null}

            <div className="surface-panel p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-brand-50 p-3 text-brand-700">
                  <User size={18} />
                </span>
                <div>
                  <h2 className="font-display text-2xl font-semibold text-slate-950">Primary contact</h2>
                  <p className="text-sm text-slate-500">Who should we contact for delivery updates and order confirmation?</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
                  <input className="input" required value={form.customer_name} onChange={updateField('customer_name')} placeholder="Your full name" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Phone number</label>
                  <input className="input" required value={form.customer_phone} onChange={updateField('customer_phone')} placeholder="+91 98765 43210" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
                  <div className="relative">
                    <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      className="input pl-11"
                      type="email"
                      required
                      value={form.customer_email}
                      onChange={updateField('customer_email')}
                      placeholder="name@company.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="surface-panel p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-brand-50 p-3 text-brand-700">
                  <Building2 size={18} />
                </span>
                <div>
                  <h2 className="font-display text-2xl font-semibold text-slate-950">Company and invoice details</h2>
                  <p className="text-sm text-slate-500">Optional for smaller orders, recommended for hotels and business buyers.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Company name</label>
                  <input className="input" value={form.company_name} onChange={updateField('company_name')} placeholder="Bittrif partner company" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">GSTIN</label>
                  <input className="input" value={form.gstin} onChange={updateField('gstin')} placeholder="22AAAAA0000A1Z5" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Invoice type</label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { value: 'gst', title: 'GST invoice', description: 'Recommended for business procurement and accounts teams.' },
                      { value: 'standard', title: 'Standard invoice', description: 'Suitable for regular direct billing.' },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`cursor-pointer rounded-3xl border p-4 ${
                          form.invoice_type === option.value ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="invoice_type"
                          value={option.value}
                          checked={form.invoice_type === option.value}
                          onChange={updateField('invoice_type')}
                          className="sr-only"
                        />
                        <div className="flex items-start gap-3">
                          <span className={`mt-1 h-4 w-4 rounded-full border ${form.invoice_type === option.value ? 'border-brand-700 bg-brand-700' : 'border-slate-300'}`} />
                          <div>
                            <p className="font-semibold text-slate-900">{option.title}</p>
                            <p className="mt-1 text-sm leading-6 text-slate-500">{option.description}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="surface-panel p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-brand-50 p-3 text-brand-700">
                  <MapPin size={18} />
                </span>
                <div>
                  <h2 className="font-display text-2xl font-semibold text-slate-950">Delivery address</h2>
                  <p className="text-sm text-slate-500">Give operations enough detail to route the order correctly the first time.</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Address</label>
                  <textarea
                    className="input min-h-[110px] resize-none"
                    required
                    value={form.address}
                    onChange={updateField('address')}
                    placeholder="Building, floor, street, locality"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Landmark or delivery note</label>
                  <input className="input" value={form.landmark} onChange={updateField('landmark')} placeholder="Reception desk, loading gate, block B" />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">City</label>
                    <input className="input" value={form.city} onChange={updateField('city')} placeholder="Mumbai" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">State</label>
                    <input className="input" value={form.state} onChange={updateField('state')} placeholder="Maharashtra" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">PIN code</label>
                    <input className="input" required value={form.pincode} onChange={updateField('pincode')} placeholder="400001" />
                  </div>
                </div>
              </div>
            </div>

            <div className="surface-panel p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-brand-50 p-3 text-brand-700">
                  <Truck size={18} />
                </span>
                <div>
                  <h2 className="font-display text-2xl font-semibold text-slate-950">Delivery and payment preferences</h2>
                  <p className="text-sm text-slate-500">Set expectations for dispatch urgency and how your team wants to complete the order.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {DELIVERY_TYPES.map((option) => (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-3xl border p-4 ${
                      form.delivery_type === option.value ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery_type"
                      value={option.value}
                      checked={form.delivery_type === option.value}
                      onChange={updateField('delivery_type')}
                      className="sr-only"
                    />
                    <div className="flex items-start gap-3">
                      <span className={`mt-1 h-4 w-4 rounded-full border ${form.delivery_type === option.value ? 'border-brand-700 bg-brand-700' : 'border-slate-300'}`} />
                      <div>
                        <p className="font-semibold text-slate-900">{option.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{option.description}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Preferred slot</label>
                  <select className="input" value={form.preferred_slot} onChange={updateField('preferred_slot')}>
                    <option value="business-hours">Business hours</option>
                    <option value="morning">Morning delivery</option>
                    <option value="afternoon">Afternoon delivery</option>
                    <option value="anytime">Anytime</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Payment method</label>
                  <select className="input" value={form.payment_method} onChange={updateField('payment_method')}>
                    {PAYMENT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {PAYMENT_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={`rounded-3xl border p-4 ${
                      form.payment_method === option.value ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="rounded-2xl bg-white p-2 text-brand-700">
                        {option.value === 'cod' ? <CreditCard size={16} /> : <FileText size={16} />}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{option.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{option.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-panel p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-brand-50 p-3 text-brand-700">
                  <MessageSquare size={18} />
                </span>
                <div>
                  <h2 className="font-display text-2xl font-semibold text-slate-950">Additional order notes</h2>
                  <p className="text-sm text-slate-500">Share receiving instructions, approvals, or purchase-order context.</p>
                </div>
              </div>
              <textarea
                className="input mt-6 min-h-[140px] resize-none"
                value={form.order_notes}
                onChange={updateField('order_notes')}
                placeholder="Example: call housekeeping supervisor on arrival, include department name on invoice, or reference internal PO number."
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center gap-3 py-4 text-base font-bold">
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Placing order...
                </>
              ) : (
                <>
                  Place order request
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="space-y-5">
            <div className="surface-panel sticky top-28 p-6">
              <h2 className="font-display text-2xl font-semibold text-slate-950">Order summary</h2>
              <p className="mt-2 text-sm text-slate-500">Your cart stays visible while the checkout form auto-saves.</p>

              <div className="mt-6 space-y-3 border-b border-slate-100 pb-5">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img src={item.image} alt={item.name} className="h-14 w-14 rounded-2xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Qty {item.quantity} x {formatPrice(item.price)}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-slate-950">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-950">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span className={`font-semibold ${shipping === 0 ? 'text-emerald-600' : 'text-slate-950'}`}>
                    {shipping === 0 ? 'Free' : formatPrice(shipping)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-4 text-base font-bold text-slate-950">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <div className="mt-6 rounded-3xl bg-brand-950 p-5 text-white">
                <p className="text-sm font-semibold text-gold-400">What happens next</p>
                <div className="mt-4 grid gap-3 text-sm leading-7 text-slate-200">
                  <div className="inline-flex items-start gap-3">
                    <CheckCircle size={16} className="mt-1 shrink-0 text-gold-400" />
                    Sales and operations can use your company details and notes to confirm the order faster.
                  </div>
                  <div className="inline-flex items-start gap-3">
                    <CheckCircle size={16} className="mt-1 shrink-0 text-gold-400" />
                    If you choose proforma invoice, your team can follow up with documentation before dispatch.
                  </div>
                </div>
              </div>
            </div>

            <div className="surface-panel p-6">
              <h3 className="font-display text-xl font-semibold text-slate-950">Buyer reassurance</h3>
              <div className="mt-5 grid gap-4 text-sm leading-7 text-slate-600">
                <div className="inline-flex items-start gap-3">
                  <span className="rounded-2xl bg-emerald-50 p-2 text-emerald-600">
                    <ShieldCheck size={16} />
                  </span>
                  Secure checkout flow with saved progress.
                </div>
                <div className="inline-flex items-start gap-3">
                  <span className="rounded-2xl bg-brand-50 p-2 text-brand-700">
                    <Truck size={16} />
                  </span>
                  Delivery type and preferred slot captured before order placement.
                </div>
                <div className="inline-flex items-start gap-3">
                  <span className="rounded-2xl bg-brand-50 p-2 text-brand-700">
                    <Phone size={16} />
                  </span>
                  Contact details stored so your team can be reached without extra follow-up.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
