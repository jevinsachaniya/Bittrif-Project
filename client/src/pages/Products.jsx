import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import {
  ArrowRight,
  ArrowUpDown,
  BadgeCheck,
  CircleAlert,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { formatPrice, API } from '../lib/utils'

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name: A to Z' },
  { value: 'stock', label: 'Stock ready first' },
]

function ProductListCard({ product }) {
  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null
  const quotePath = `/contact?product=${encodeURIComponent(product.name)}`

  return (
    <article className="surface-panel group grid gap-5 p-5 md:grid-cols-[180px_1fr]">
      <Link to={`/product/${product.id}`} className="relative overflow-hidden rounded-3xl bg-slate-100">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {discount ? (
          <span className="badge absolute left-3 top-3 bg-rose-500 text-white">
            Save {discount}%
          </span>
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-col justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.category_name ? (
              <span className="badge bg-brand-50 text-brand-800">{product.category_name}</span>
            ) : null}
            {product.is_featured === 1 ? (
              <span className="badge bg-gold-500/20 text-amber-800">Featured</span>
            ) : null}
            <span className={`badge ${product.stock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {product.stock > 0 ? `${product.stock} ready to dispatch` : 'Out of stock'}
            </span>
          </div>
          <Link to={`/product/${product.id}`}><h3 className="mt-4 font-display text-2xl font-semibold text-slate-900 hover:text-brand-700">{product.name}</h3></Link>
          <p className="mt-2 text-sm font-medium text-slate-500">{product.unit}</p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            {product.description || 'Professional-grade supply item for hospitality and facilities teams.'}
          </p>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Commercial price</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-950">{formatPrice(product.price)}</span>
              {product.original_price ? (
                <span className="text-sm text-slate-400 line-through">{formatPrice(product.original_price)}</span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to={quotePath} className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-800">
              Get best quote
            </Link>
            <Link to={`/product/${product.id}`} className="btn-outline gap-2 px-4 py-3 text-sm">
              View details
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [view, setView] = useState('grid')
  const [sort, setSort] = useState('recommended')
  const [featuredOnly, setFeaturedOnly] = useState(searchParams.get('featured') === '1')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  const activeCategory = searchParams.get('category') || ''
  const activeSearch = searchParams.get('search') || ''

  useEffect(() => {
    axios.get(`${API}/categories`).then((response) => setCategories(response.data)).catch(() => setError('Categories could not be loaded.'))
  }, [])

  useEffect(() => {
    setSearch(activeSearch)
  }, [activeSearch])

  useEffect(() => {
    setLoading(true)
    setError('')
    const params = {}
    if (activeCategory) params.category = activeCategory
    if (activeSearch) params.search = activeSearch
    if (featuredOnly) params.featured = true

    axios
      .get(`${API}/products`, { params })
      .then((response) => {
        setProducts(response.data)
        setLoading(false)
      })
      .catch(() => {
        setProducts([])
        setError('The catalog is unavailable right now. Check your connection and try again.')
        setLoading(false)
      })
  }, [activeCategory, activeSearch, featuredOnly, retry])

  const activeCategoryData = categories.find((category) => String(category.id) === String(activeCategory))

  const setCategory = (id) => {
    const nextParams = new URLSearchParams(searchParams)
    if (id) nextParams.set('category', id)
    else nextParams.delete('category')
    setSearchParams(nextParams)
  }

  const doSearch = () => {
    const nextParams = new URLSearchParams(searchParams)
    if (search.trim()) nextParams.set('search', search.trim())
    else nextParams.delete('search')
    setSearchParams(nextParams)
  }

  const clearFilters = () => {
    setSearch('')
    setFeaturedOnly(false)
    setInStockOnly(false)
    setSort('recommended')
    setMinPrice('')
    setMaxPrice('')
    setSearchParams({})
  }

  const visibleProducts = [...products]
    .filter((product) => (inStockOnly ? product.stock > 0 : true))
    .filter((product) => (minPrice ? product.price >= Number(minPrice) : true))
    .filter((product) => (maxPrice ? product.price <= Number(maxPrice) : true))
    .sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'stock') return b.stock - a.stock
      if (b.is_featured !== a.is_featured) return b.is_featured - a.is_featured
      return a.name.localeCompare(b.name)
    })

  const activeFilterCount = [Boolean(activeCategory), Boolean(activeSearch), featuredOnly, inStockOnly, Boolean(minPrice), Boolean(maxPrice)].filter(Boolean).length

  return (
    <div className="page-shell">
      <section className="relative overflow-hidden border-b border-slate-200/70 bg-white/80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.14),_transparent_28rem)]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-16">
          <div className="relative">
            <p className="section-kicker">The Nivora edit</p>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
              Find something useful, beautiful, or both.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              Browse practical pieces for home, travel, wellness, gifting, and all the moments in between.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="status-pill">
                <BadgeCheck size={14} />
                Bulk pricing support
              </span>
              <span className="status-pill">
                <BadgeCheck size={14} />
                GST invoice options
              </span>
              <span className="status-pill">
                <BadgeCheck size={14} />
                Dispatch-ready stock visibility
              </span>
            </div>
          </div>

          <div className="surface-panel relative p-6 sm:p-7">
            <div className="flex items-center gap-3 text-sm font-semibold text-brand-800">
              <Sparkles size={18} />
              Catalog tools
            </div>
            <div className="mt-5 flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && doSearch()}
                placeholder="Search disinfectants, amenities, floor care..."
                className="w-full bg-transparent px-4 py-4 text-sm text-slate-900 outline-none"
              />
              {search ? (
                <button onClick={() => setSearch('')} className="px-3 text-slate-400 hover:text-slate-700" aria-label="Clear search">
                  <X size={16} />
                </button>
              ) : null}
              <button onClick={doSearch} className="bg-brand-700 px-5 py-4 text-white hover:bg-brand-800">
                <Search size={18} />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setFeaturedOnly((value) => !value)}
                className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${
                  featuredOnly ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                Featured products only
              </button>
              <button
                onClick={() => setInStockOnly((value) => !value)}
                className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${
                  inStockOnly ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                In-stock items only
              </button>
            </div>

            <div className="mt-6 rounded-3xl bg-brand-950 p-5 text-white">
              <p className="text-sm font-semibold text-gold-400">Need 25+ units or recurring supply?</p>
              <p className="mt-2 text-sm leading-7 text-slate-200">
                Browse the range, then send us your product and quantity requirement for a direct quote.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="surface-panel mb-6 overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-brand-100 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><SlidersHorizontal size={19} /></span>
              <div><p className="section-kicker">Filters</p><h2 className="mt-1 font-display text-xl font-semibold text-slate-900">Browse the catalog</h2></div>
            </div>
            {activeFilterCount > 0 && <button onClick={clearFilters} className="text-sm font-bold text-brand-700 hover:text-brand-900">Clear all filters</button>}
          </div>
          <div className="px-5 py-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Categories</p>
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
              <button onClick={() => setCategory('')} className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${!activeCategory ? 'bg-brand-700 text-white' : 'bg-brand-50 text-brand-900 hover:bg-brand-100'}`}>All categories</button>
              {categories.map((category) => {
                const active = String(category.id) === String(activeCategory)
                return <button key={category.id} onClick={() => setCategory(category.id)} className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${active ? 'bg-brand-700 text-white' : 'bg-brand-50 text-brand-900 hover:bg-brand-100'}`}>{category.name}</button>
              })}
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-brand-100 bg-brand-50/50 px-5 py-4 sm:flex-row sm:items-center">
            <p className="shrink-0 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Price per unit</p>
            <div className="grid grid-cols-2 gap-2 sm:w-64"><label className="sr-only" htmlFor="min-price">Minimum price</label><input id="min-price" type="number" min="0" inputMode="numeric" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="Min price" className="input px-3 py-2 text-sm" /><label className="sr-only" htmlFor="max-price">Maximum price</label><input id="max-price" type="number" min="0" inputMode="numeric" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Max price" className="input px-3 py-2 text-sm" /></div>
            <div className="hidden h-6 w-px bg-brand-200 sm:block" />
            <span className="text-xs text-slate-500">Choose a category or price range to refine results.</span>
          </div>
        </section>

          <div className="min-w-0">
            <div className="surface-panel mb-6 p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <Link to="/" className="hover:text-brand-700">Home</Link>
                    <span>/</span>
                    <span className="font-medium text-slate-900">Products</span>
                    {activeCategoryData ? (
                      <>
                        <span>/</span>
                        <span className="font-medium text-brand-800">{activeCategoryData.name}</span>
                      </>
                    ) : null}
                  </div>
                  <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-950">
                    {activeCategoryData?.name || 'All products'}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {activeCategoryData?.description || 'Compare commercial supply products and add the right mix to your order.'}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                    <ArrowUpDown size={16} className="text-brand-700" />
                    <select
                      value={sort}
                      onChange={(event) => setSort(event.target.value)}
                      className="bg-transparent outline-none"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1">
                    <button
                      onClick={() => setView('grid')}
                      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold ${
                        view === 'grid' ? 'bg-brand-700 text-white' : 'text-slate-600'
                      }`}
                    >
                      <LayoutGrid size={16} />
                      Grid
                    </button>
                    <button
                      onClick={() => setView('list')}
                      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold ${
                        view === 'list' ? 'bg-brand-700 text-white' : 'text-slate-600'
                      }`}
                    >
                      <List size={16} />
                      List
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{visibleProducts.length}</span>
                <span>products visible</span>
                {activeFilterCount > 0 ? <span className="status-pill">{activeFilterCount} active filters</span> : null}
                {featuredOnly ? <span className="badge bg-brand-50 text-brand-800">Featured only</span> : null}
                {inStockOnly ? <span className="badge bg-emerald-50 text-emerald-700">In stock only</span> : null}
                {activeSearch ? <span className="badge bg-slate-100 text-slate-700">Search: {activeSearch}</span> : null}
              </div>
            </div>

            {error ? (
              <div className="surface-panel p-12 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-600"><CircleAlert size={32} /></div>
                <h3 className="mt-6 font-display text-2xl font-semibold text-slate-900">The catalog needs another try.</h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-600">{error}</p>
                <button onClick={() => setRetry((value) => value + 1)} className="btn-primary mt-6">Retry catalog</button>
              </div>
            ) : loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="card overflow-hidden">
                    <div className="skeleton h-56 w-full" />
                    <div className="space-y-3 p-5">
                      <div className="skeleton h-4 w-24 rounded-full" />
                      <div className="skeleton h-7 w-3/4 rounded-xl" />
                      <div className="skeleton h-4 w-full rounded-xl" />
                      <div className="skeleton h-4 w-2/3 rounded-xl" />
                      <div className="skeleton h-14 w-full rounded-2xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="surface-panel p-12 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <Search size={30} />
                </div>
                <h3 className="mt-6 font-display text-2xl font-semibold text-slate-900">No products match these filters</h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-600">
                  Try a broader search, change the category, or clear the active filters to see the full catalog again.
                </p>
                <button onClick={clearFilters} className="btn-primary mt-6">
                  Reset catalog view
                </button>
              </div>
            ) : view === 'grid' ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visibleProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {visibleProducts.map((product) => (
                  <ProductListCard key={product.id} product={product} />
                ))}
              </div>
            )}

            <div className="surface-panel mt-8 grid gap-5 p-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
              <div>
                <p className="section-kicker">Bulk order help</p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-slate-950">
                  Need pricing for your hotel requirement?
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
              Share the products and quantity you need. Our team can confirm availability, pricing, and customization
              options for your hotel, resort, spa, or facility.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link to="/contact" className="btn-primary gap-2">
                  Request a quote
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
      </div>
    </div>
  )
}
