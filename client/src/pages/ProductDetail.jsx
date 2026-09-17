import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { ChevronLeft, ChevronRight, FileText, Minus, Phone, Plus, RotateCcw, ShoppingBag } from 'lucide-react'
import { API, formatPrice } from '../lib/utils'
import { useCart } from '../hooks/useCart'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    window.scrollTo(0, 0)
    axios.get(`${API}/products/${id}`)
      .then((response) => {
        setProduct(response.data)
        setActiveImage(0)
        setQuantity(response.data.minimum_order_quantity || 1)
      })
      .catch(() => setProduct(false))
  }, [id])

  if (product === null) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-11 w-11 animate-spin rounded-full border-4 border-brand-200 border-t-brand-700" /></div>
  if (!product) return <div className="mx-auto max-w-3xl px-4 py-28 text-center"><h1 className="font-display text-3xl font-bold text-slate-900">This product is not available.</h1><Link to="/products" className="btn-primary mt-6">Back to products</Link></div>

  const galleryImages = Array.isArray(product.images) ? product.images : []
  const images = Array.from(new Set((galleryImages.length ? galleryImages : [product.image]).filter(Boolean))).slice(0, 5)
  const currentImage = images[activeImage] || product.image
  const quotePath = `/contact?product=${encodeURIComponent(product.name)}`
  const minimumQuantity = product.minimum_order_quantity || 1
  const specifications = [
    ['Product category', product.category_name || 'Everyday essentials'],
    ['Pack size', product.unit || 'Standard pack'],
    ['Customization available', 'Yes'],
    ['Usage / application', 'For everyday use'],
    ['Availability', product.stock > 0 ? 'In stock' : 'On enquiry'],
    ['Country of origin', 'Made in India'],
  ]

  const moveImage = (direction) => setActiveImage((current) => (current + direction + images.length) % images.length)
  const orderNow = () => {
    addToCart(product, quantity)
    navigate('/checkout')
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-7">
        <div className="flex items-start gap-6 border-t border-slate-200 pt-5 sm:gap-8 lg:gap-14">
          <section className="w-5/12 shrink-0 lg:w-[420px]">
            <div className="relative overflow-hidden bg-slate-950">
              <img src={currentImage} alt={product.name} className="aspect-[4/5] w-full object-contain" />
              <Link to={quotePath} className="absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-8 py-3 text-sm font-bold text-brand-700 shadow-xl hover:bg-brand-50">Get Best Quote</Link>
              {images.length > 1 && <><button onClick={() => moveImage(-1)} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-900 shadow hover:bg-white" aria-label="Previous product image"><ChevronLeft size={24} /></button><button onClick={() => moveImage(1)} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-900 shadow hover:bg-white" aria-label="Next product image"><ChevronRight size={24} /></button></>}
            </div>
            {images.length > 1 && <div className="mt-4 flex gap-3 overflow-x-auto pb-1">{images.map((image, index) => <button key={image} onClick={() => setActiveImage(index)} className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white ${activeImage === index ? 'border-brand-700' : 'border-slate-200 hover:border-brand-300'}`} aria-label={`View product image ${index + 1}`}><img src={image} alt="" className="h-full w-full object-cover" /></button>)}</div>}
          </section>

          <section className="min-w-0 flex-1 max-w-2xl">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <h1 className="font-display text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">{product.name}</h1>
              <a href="tel:+917228041690" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-brand-600 bg-white px-4 py-2 text-sm font-bold text-brand-700 hover:bg-brand-50"><Phone size={16} />Request Callback</a>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2"><span className="text-3xl font-medium text-slate-950">{formatPrice(product.price)}</span><span className="text-sm text-slate-600">/ {product.unit || 'piece'}</span><Link to={quotePath} className="text-lg font-semibold text-brand-700 underline underline-offset-2">Get Latest Price</Link></div>
            <a href={quotePath} className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-brand-700"><FileText size={17} className="text-rose-500" />Product Brochure</a>

            <dl className="mt-4 grid grid-cols-[minmax(150px,0.8fr)_minmax(0,1fr)] gap-x-6 gap-y-3 text-sm sm:text-[15px]">
              {specifications.map(([label, value]) => <div key={label} className="contents"><dt className="font-bold leading-5 text-slate-800">{label}</dt><dd className="leading-5 text-slate-600">{value}</dd></div>)}
            </dl>

            <p className="mt-5 text-base font-semibold text-slate-800">Minimum order quantity: <span className="font-normal">{minimumQuantity} {product.unit || 'units'}</span></p>
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-brand-100 bg-brand-50/60 p-3 sm:flex-row sm:items-center">
              <div className="inline-flex items-center justify-between rounded-lg border border-brand-200 bg-white"><button onClick={() => setQuantity((current) => Math.max(minimumQuantity, current - 1))} className="p-2.5 text-brand-800" aria-label="Reduce order quantity"><Minus size={15} /></button><span className="min-w-10 text-center text-sm font-bold text-slate-900">{quantity}</span><button onClick={() => setQuantity((current) => Math.min(product.stock || current + 1, current + 1))} className="p-2.5 text-brand-800" aria-label="Increase order quantity"><Plus size={15} /></button></div>
              <button onClick={orderNow} disabled={product.stock < minimumQuantity} className="btn-primary flex-1 justify-center gap-2 py-3 disabled:cursor-not-allowed disabled:bg-slate-300"><ShoppingBag size={17} />Order now</button>
            </div>
            <p className="mt-2 text-xs font-medium text-brand-800">Order quantity must be {minimumQuantity} {product.unit || 'units'} or more.</p>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">{product.name}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{product.description || 'A useful everyday essential, selected for its practical design and easy place in your routine.'}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Nivora Mart brings together thoughtful finds for home, travel, gifting, and everyday living.</p>

            <Link to={quotePath} className="mt-5 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-brand-700 px-6 py-4 text-base font-bold text-white hover:bg-brand-800"><Phone size={19} />Yes! I am interested</Link>
            <Link to="/products" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-900"><RotateCcw size={15} />Back to all products</Link>
          </section>
        </div>
      </main>
    </div>
  )
}
