import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from 'lucide-react'
import { useCart } from '../hooks/useCart'
import { formatPrice } from '../lib/utils'

export default function Cart() {
  const { cart, removeFromCart, updateQty, totalPrice } = useCart()
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const shipping = 0
  const total = totalPrice + shipping
  const remainingForFreeShipping = 0

  if (!cart.length) {
    return (
      <div className="mx-auto flex min-h-[72vh] max-w-3xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="surface-panel w-full p-10 text-center sm:p-14">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <ShoppingBag size={52} />
          </div>
          <h1 className="mt-8 font-display text-4xl font-bold tracking-tight text-slate-950">Your cart is empty</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-slate-600">
            Start building your Bittrif order with cleaning supplies, amenities, and other business-ready products.
            Once items are in the cart, the new checkout can capture company and delivery details too.
          </p>
          <Link to="/products" className="btn-primary mt-8 gap-2">
            Browse catalog
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <section className="border-b border-slate-200/70 bg-white/80">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="section-kicker">Cart review</p>
              <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                Review your Bittrif order before checkout.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                Confirm quantity, keep an eye on commercial pricing, and move ahead with delivery preferences and GST
                details in the next step.
              </p>
            </div>
            <div className="surface-panel p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl bg-brand-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Line items</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-950">{cart.length}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Units</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-950">{itemCount}</p>
                </div>
                <div className="rounded-3xl bg-gold-500/15 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">Current value</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-950">{formatPrice(totalPrice)}</p>
                </div>
              </div>
            </div>
          </div>

          {shipping > 0 ? (
            <div className="surface-panel mt-8 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <Truck size={18} className="text-brand-700" />
                  Add {formatPrice(remainingForFreeShipping)} more to unlock free delivery.
                </div>
                <span className="text-sm text-slate-500">{Math.min(Math.round((totalPrice / 999) * 100), 100)}% of threshold reached</span>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-600 to-gold-500 transition-all duration-500"
                  style={{ width: `${Math.min((totalPrice / 999) * 100, 100)}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="surface-panel p-5">
                <div className="grid gap-5 md:grid-cols-[112px_1fr_auto] md:items-center">
                  <Link to={`/product/${item.id}`} className="overflow-hidden rounded-3xl bg-slate-100">
                    <img src={item.image} alt={item.name} className="h-28 w-full object-cover transition-transform duration-300 hover:scale-105" />
                  </Link>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.category_name ? <span className="badge bg-brand-50 text-brand-800">{item.category_name}</span> : null}
                      <span className="badge bg-slate-100 text-slate-600">{item.unit}</span>
                    </div>
                    <Link to={`/product/${item.id}`}>
                      <h2 className="mt-3 font-display text-2xl font-semibold text-slate-950 hover:text-brand-800">
                        {item.name}
                      </h2>
                    </Link>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      Commercial unit price {formatPrice(item.price)}. Update quantity here before you continue to the
                      checkout request form.
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-4 md:items-end">
                    <div className="inline-flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <button
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        className="px-3 py-3 text-slate-600 hover:bg-slate-50"
                        aria-label={`Reduce quantity for ${item.name}`}
                      >
                        <Minus size={15} />
                      </button>
                      <span className="min-w-[3rem] border-x border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        className="px-3 py-3 text-slate-600 hover:bg-slate-50"
                        aria-label={`Increase quantity for ${item.name}`}
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Line total</p>
                      <p className="mt-1 text-2xl font-extrabold text-slate-950">{formatPrice(item.price * item.quantity)}</p>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100"
                    >
                      <Trash2 size={15} />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-5">
            <div className="surface-panel sticky top-28 p-6">
              <h2 className="font-display text-2xl font-semibold text-slate-950">Order summary</h2>
              <div className="mt-6 space-y-4 text-sm text-slate-600">
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

              <div className="mt-6 grid gap-3">
                <Link to="/checkout" className="btn-primary w-full justify-center gap-2 py-3.5">
                  Continue to checkout
                  <ArrowRight size={16} />
                </Link>
                <Link to="/products" className="btn-outline w-full justify-center py-3.5">
                  Add more products
                </Link>
              </div>

              <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5 text-sm text-slate-600">
                <div className="inline-flex items-start gap-3">
                  <span className="rounded-2xl bg-emerald-50 p-2 text-emerald-600">
                    <ShieldCheck size={16} />
                  </span>
                  Secure cart and checkout experience
                </div>
                <div className="inline-flex items-start gap-3">
                  <span className="rounded-2xl bg-brand-50 p-2 text-brand-700">
                    <Building2 size={16} />
                  </span>
                  Company and GST fields available at checkout
                </div>
                <div className="inline-flex items-start gap-3">
                  <span className="rounded-2xl bg-gold-500/15 p-2 text-amber-700">
                    <Truck size={16} />
                  </span>
                  Standard and priority delivery preferences supported
                </div>
              </div>
            </div>

            <div className="surface-panel p-6">
              <p className="section-kicker">Why this flow is better</p>
              <div className="mt-4 grid gap-4 text-sm leading-7 text-slate-600">
                <div className="inline-flex items-start gap-3">
                  <span className="rounded-2xl bg-brand-50 p-2 text-brand-700">
                    <Package size={16} />
                  </span>
                  Capture delivery instructions and order notes before the sales team processes fulfillment.
                </div>
                <div className="inline-flex items-start gap-3">
                  <span className="rounded-2xl bg-brand-50 p-2 text-brand-700">
                    <BadgeCheck size={16} />
                  </span>
                  Keep business billing cleaner with dedicated invoice and GST fields in checkout.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
