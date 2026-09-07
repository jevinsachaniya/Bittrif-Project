import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Pencil, Plus, Search, Star, Trash2, Package } from 'lucide-react'
import { formatPrice, API } from '../../lib/utils'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const load = () => axios.get(`${API}/products`).then((response) => setProducts(response.data))

  useEffect(() => { load() }, [])

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return
    await axios.delete(`${API}/products/${id}`)
    load()
  }

  const filtered = products.filter((product) => !search || product.name.toLowerCase().includes(search.toLowerCase()) || (product.category_name || '').toLowerCase().includes(search.toLowerCase()))

  return <div className="space-y-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="section-kicker">Inventory</p><h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.04em] text-slate-900">Product library</h1><p className="mt-1 text-sm text-slate-500">{products.length} products listed</p></div><Link to="/admin/products/new" className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-3"><Plus size={17} />Add product</Link></div>
    <div className="surface-panel p-4"><div className="relative"><Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products or categories..." className="input pl-9 text-sm" /></div></div>
    <div className="surface-panel overflow-hidden">
      {filtered.length === 0 ? <div className="py-20 text-center text-slate-400"><Package size={40} className="mx-auto mb-3 opacity-30" /><p className="text-sm font-medium">No products found</p></div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50">{['Product', 'Category', 'Price', 'Stock', 'Featured', 'Actions'].map((heading) => <th key={heading} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">{heading}</th>)}</tr></thead><tbody>{filtered.map((product, index) => <tr key={product.id} className={`border-b border-slate-50 transition-colors hover:bg-slate-50/80 ${index === filtered.length - 1 ? 'border-0' : ''}`}><td className="px-5 py-3.5"><div className="flex items-center gap-3"><div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">{product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-slate-300"><Package size={16} /></div>}</div><div><p className="max-w-[190px] truncate font-semibold text-slate-800">{product.name}</p><p className="text-xs text-slate-400">{product.unit}</p></div></div></td><td className="px-5 py-3.5">{product.category_name ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{product.category_name}</span> : <span className="text-xs text-slate-400">Not set</span>}</td><td className="px-5 py-3.5"><p className="font-bold text-slate-800">{formatPrice(product.price)}</p></td><td className="px-5 py-3.5"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${product.stock > 50 ? 'bg-emerald-100 text-emerald-700' : product.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{product.stock > 0 ? `${product.stock} units` : 'Out of stock'}</span></td><td className="px-5 py-3.5">{product.is_featured ? <Star size={16} className="fill-amber-400 text-amber-500" /> : <span className="text-slate-300">-</span>}</td><td className="px-5 py-3.5"><div className="flex gap-1.5"><Link to={`/admin/products/${product.id}/edit`} className="rounded-xl bg-brand-50 p-2 text-brand-700 hover:bg-brand-100" aria-label={`Edit ${product.name}`}><Pencil size={14} /></Link><button onClick={() => deleteProduct(product.id)} className="rounded-xl bg-red-50 p-2 text-red-500 hover:bg-red-100" aria-label={`Delete ${product.name}`}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div>}
    </div>
  </div>
}
