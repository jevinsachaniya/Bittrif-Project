import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Check, Plus } from 'lucide-react'
import { formatPrice } from '../lib/utils'
import { useCart } from '../hooks/useCart'
import ProductImage from './ProductImage'

export default function ProductCard({ product }) {
  const { cart, addToCart } = useCart()
  const reducedMotion = useReducedMotion()
  const [added, setAdded] = useState(false)
  const timer = useRef(null)
  const discount = product.original_price > product.price ? Math.round((1 - product.price / product.original_price) * 100) : null
  const minimum = product.minimum_order_quantity || 1
  const inCart = cart.find((item) => item.id === product.id)?.quantity || 0
  const canAdd = product.stock >= inCart + minimum
  useEffect(() => () => clearTimeout(timer.current), [])

  const handleAdd = () => {
    if (!canAdd) return
    addToCart(product, minimum)
    setAdded(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setAdded(false), 2000)
  }

  return <motion.article layout={!reducedMotion} initial={false} transition={{ duration: .35 }} className="product-card product-hover card group flex h-full flex-col overflow-hidden">
    <Link to={'/product/' + product.id} className="relative block overflow-hidden bg-brand-50"><ProductImage src={product.image} alt={product.name} imageClassName="h-[235px] w-full object-cover"><span className="product-preview" aria-hidden="true">Take a closer look <ArrowUpRight size={15} /></span></ProductImage>{discount ? <span className="badge absolute left-3 top-3 bg-white/95 text-brand-800">Save {discount}%</span> : product.is_featured ? <span className="badge absolute left-3 top-3 bg-white/95 text-brand-800">The Nivora edit</span> : null}</Link>
    <div className="flex flex-1 flex-col p-5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-brand-600">{product.category_name || 'Everyday essentials'}</p>
      <Link to={'/product/' + product.id} className="mt-2"><h3 className="font-display text-xl font-medium leading-snug text-brand-950 hover:text-brand-600">{product.name}</h3></Link>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{product.description || 'A thoughtful addition to your everyday.'}</p>
      <p className="mt-2 text-[11px] text-slate-500">{product.unit || 'Standard pack'}{minimum > 1 ? ' · Minimum ' + minimum : ''}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-5"><div><span className="text-base font-semibold text-brand-950">{formatPrice(product.price)}</span>{discount && <span className="ml-2 text-xs text-slate-400 line-through">{formatPrice(product.original_price)}</span>}<p className="mt-1 text-[10px] text-brand-600" role="status">{added ? 'Added to your bag' : product.stock > 0 ? 'Available to order' : 'Available on enquiry'}</p></div><button onClick={handleAdd} disabled={!canAdd || added} className="quick-add" aria-label={added ? 'Added to bag' : 'Add ' + product.name + ' to bag'} title={canAdd ? 'Add to bag' : 'No more stock available'}>{added ? <Check size={18} /> : <Plus size={19} />}</button></div>
      <div className="mt-4 flex items-center justify-between border-t border-brand-100 pt-3 text-xs"><Link to={'/product/' + product.id} className="font-medium text-brand-800">View details</Link><Link to={'/contact?product=' + encodeURIComponent(product.name)} className="inline-flex items-center gap-1 text-slate-500">Get a quote <ArrowUpRight size={13} /></Link></div>
    </div>
  </motion.article>
}
