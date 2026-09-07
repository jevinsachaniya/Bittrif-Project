import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, ImagePlus, LoaderCircle, Plus, Trash2, UploadCloud } from 'lucide-react'
import { API } from '../../lib/utils'

const emptyForm = { name: '', description: '', price: '', original_price: '', category_id: '', stock: 100, minimum_order_quantity: 1, unit: 'piece', is_featured: 0 }

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = reject
  reader.readAsDataURL(file)
})

export default function AdminProductForm() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(productId)
  const [form, setForm] = useState(emptyForm)
  const [categories, setCategories] = useState([])
  const [images, setImages] = useState([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    axios.get(`${API}/categories`).then((response) => setCategories(response.data))
    if (!editing) return
    axios.get(`${API}/products/${productId}`).then((response) => {
      const product = response.data
      setForm({ name: product.name || '', description: product.description || '', price: product.price || '', original_price: product.original_price || '', category_id: product.category_id ? String(product.category_id) : '', stock: product.stock ?? 100, minimum_order_quantity: product.minimum_order_quantity || 1, unit: product.unit || 'piece', is_featured: Number(product.is_featured) })
      setImages(Array.isArray(product.images) ? product.images : [product.image].filter(Boolean))
    }).catch(() => setError('Product could not be loaded.'))
  }, [editing, productId])

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  const uploadFiles = async (event) => {
    const files = Array.from(event.target.files || []).slice(0, 5 - images.length)
    if (!files.length) return
    setUploading(true)
    setError('')
    try {
      const uploaded = await Promise.all(files.map(async (file) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Use JPG, PNG, or WebP images only.')
        if (file.size > 8 * 1024 * 1024) throw new Error('Each image must be smaller than 8 MB.')
        const { data } = await axios.post(`${API}/uploads`, { filename: file.name, data_url: await readAsDataUrl(file) })
        return data.url
      }))
      setImages((current) => [...current, ...uploaded].slice(0, 5))
    } catch (uploadError) {
      setError(uploadError.response?.data?.detail || uploadError.message || 'Image upload failed. Try again.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!images.length) return setError('Upload at least one product image.')
    setSaving(true)
    setError('')
    const payload = { ...form, price: Number(form.price), original_price: form.original_price ? Number(form.original_price) : null, category_id: form.category_id ? Number(form.category_id) : null, stock: Number(form.stock), minimum_order_quantity: Number(form.minimum_order_quantity), is_featured: Number(form.is_featured), image: images[0], images }
    try {
      if (editing) await axios.put(`${API}/products/${productId}`, payload)
      else await axios.post(`${API}/products`, payload)
      navigate('/admin/products')
    } catch (submitError) {
      setError(submitError.response?.data?.detail || 'Product could not be saved. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/admin/products" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-900"><ArrowLeft size={16} />Back to product library</Link>
      <div className="surface-panel overflow-hidden">
        <div className="border-b border-brand-100 bg-brand-50/60 px-6 py-6"><p className="section-kicker">Inventory</p><h1 className="mt-2 font-display text-3xl font-bold text-slate-900">{editing ? 'Edit product' : 'Add a product'}</h1><p className="mt-1 text-sm text-slate-500">Upload product photos directly from your device and add catalog details.</p></div>
        <form onSubmit={submit} className="space-y-7 p-6">
          <div><div className="mb-3 flex items-center justify-between"><div><h2 className="font-bold text-slate-800">Product images</h2><p className="mt-1 text-xs text-slate-500">Upload up to 5 JPG, PNG, or WebP images. The first image becomes the product cover.</p></div><span className="text-sm font-bold text-brand-700">{images.length}/5</span></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{images.map((image, index) => <div key={image} className="relative aspect-square overflow-hidden rounded-xl border border-brand-100 bg-brand-50"><img src={image} alt={`Product upload ${index + 1}`} className="h-full w-full object-cover" />{index === 0 && <span className="absolute left-2 top-2 rounded-full bg-brand-700 px-2 py-1 text-[10px] font-bold text-white">Cover</span>}<button type="button" onClick={() => setImages((current) => current.filter((_, imageIndex) => imageIndex !== index))} className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-red-500 shadow" aria-label="Remove image"><Trash2 size={14} /></button></div>)}{images.length < 5 && <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 p-3 text-center text-brand-700 hover:bg-brand-50"><input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={uploadFiles} disabled={uploading} />{uploading ? <LoaderCircle size={25} className="animate-spin" /> : <UploadCloud size={25} />}<span className="mt-2 text-xs font-bold">{uploading ? 'Uploading...' : 'Upload photos'}</span></label>}</div></div>
          <div className="grid gap-5 md:grid-cols-2"><div className="md:col-span-2"><label className="label">Product name *</label><input className="input" required value={form.name} onChange={set('name')} /></div><div className="md:col-span-2"><label className="label">Description</label><textarea className="input resize-none" rows={3} value={form.description} onChange={set('description')} /></div><div><label className="label">Selling price *</label><input className="input" required type="number" min="1" value={form.price} onChange={set('price')} /></div><div><label className="label">Original price</label><input className="input" type="number" min="1" value={form.original_price} onChange={set('original_price')} /></div><div><label className="label">Category</label><select className="input" value={form.category_id} onChange={set('category_id')}><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div><div><label className="label">Pack size</label><input className="input" value={form.unit} onChange={set('unit')} /></div><div><label className="label">Stock quantity</label><input className="input" type="number" min="0" value={form.stock} onChange={set('stock')} /></div><div><label className="label">Minimum order quantity *</label><input className="input" required type="number" min="1" value={form.minimum_order_quantity} onChange={set('minimum_order_quantity')} /></div><label className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-slate-700"><input type="checkbox" className="h-4 w-4 accent-amber-500" checked={form.is_featured === 1} onChange={(event) => setForm((current) => ({ ...current, is_featured: event.target.checked ? 1 : 0 }))} /><ImagePlus size={17} className="text-amber-500" />Featured product</label></div>
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><Link to="/admin/products" className="btn-outline justify-center">Cancel</Link><button type="submit" disabled={saving || uploading} className="btn-primary justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"><Plus size={17} />{saving ? 'Saving...' : editing ? 'Save changes' : 'Add product'}</button></div>
        </form>
      </div>
    </div>
  )
}
