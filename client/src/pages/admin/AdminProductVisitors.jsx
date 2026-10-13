import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { ChevronLeft, ChevronRight, RefreshCw, Search, Users } from 'lucide-react'
import { API } from '../../lib/utils'

const SOURCES = { account: 'Logged in', shared: 'Details shared', guest: 'Guest' }

function visitDate(value) {
  return new Date(`${value.replace(' ', 'T')}Z`).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminProductVisitors() {
  const [requestState, setRequestState] = useState({ result: { items: [], total: 0 }, key: null, error: '' })
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [source, setSource] = useState('all')
  const [page, setPage] = useState(1)
  const [refresh, setRefresh] = useState(0)
  const pageSize = 25
  const requestKey = JSON.stringify([query, source, page, refresh])
  const result = requestState.result
  const loading = requestState.key !== requestKey
  const error = loading ? '' : requestState.error

  useEffect(() => {
    const timer = window.setTimeout(() => { setQuery(search.trim()); setPage(1) }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const controller = new AbortController()
    axios.get(`${API}/admin/product-visits`, {
      params: { search: query, source, page, page_size: pageSize }, signal: controller.signal,
    }).then(({ data }) => {
      if (!controller.signal.aborted) setRequestState({ result: data, key: requestKey, error: '' })
    }).catch((requestError) => {
      if (!axios.isCancel(requestError)) setRequestState({ result: { items: [], total: 0 }, key: requestKey, error: 'Unable to load product visitors. Please try refreshing.' })
    })
    return () => controller.abort()
  }, [query, source, page, requestKey])

  const pages = Math.max(1, Math.ceil(result.total / pageSize))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="section-kicker">Customer interest</p><h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Product Visitors</h1><p className="mt-2 text-sm text-slate-500">One entry per client and product, with total visits and the most recent visit time.</p></div>
        <button onClick={() => setRefresh((value) => value + 1)} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-brand-100 bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />Refresh</button>
      </div>
      <div className="surface-panel flex flex-col gap-3 p-4 sm:flex-row">
        <div className="relative flex-1"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Search product visitors" className="input pl-10 text-sm" placeholder="Search name, email, phone or product..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <select aria-label="Filter visitor type" className="input text-sm sm:w-48" value={source} onChange={(event) => { setSource(event.target.value); setPage(1) }}><option value="all">All visitors</option>{Object.entries(SOURCES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      </div>
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <div className="surface-panel overflow-hidden" aria-busy={loading}>
        {loading ? <p role="status" className="py-16 text-center text-sm text-slate-500">Loading visitors...</p> : error ? <p className="py-16 text-center text-sm text-slate-500">Refresh to try again.</p> : result.items.length === 0 ? <div className="py-16 text-center text-slate-400"><Users size={36} className="mx-auto mb-3 opacity-40" /><p className="text-sm">{query || source !== 'all' ? 'No visitors match your filters.' : 'No product visits yet.'}</p></div> : (
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50">{['Client', 'Email', 'Phone', 'Product', 'Visitor type', 'Visits', 'Last visit'].map((heading) => <th key={heading} scope="col" className="whitespace-nowrap px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">{heading}</th>)}</tr></thead><tbody>{result.items.map((visit) => <tr key={visit.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80"><td className="px-5 py-4 font-semibold text-slate-800">{visit.customer_name || 'Guest'}</td><td className="px-5 py-4 text-slate-600">{visit.customer_email || '—'}</td><td className="whitespace-nowrap px-5 py-4 text-slate-600">{visit.customer_phone || '—'}</td><td className="min-w-48 px-5 py-4"><Link to={`/product/${visit.product_id}`} className="font-semibold text-brand-700 hover:underline">{visit.product_name}</Link></td><td className="whitespace-nowrap px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${visit.source === 'guest' ? 'bg-slate-100 text-slate-600' : 'bg-brand-50 text-brand-700'}`}>{SOURCES[visit.source]}</span></td><td className="px-5 py-4 font-semibold text-slate-800">{visit.visit_count}</td><td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{visitDate(visit.last_visited_at)}{visit.visit_count > 1 && <div className="mt-1 text-[11px] text-slate-400">First: {visitDate(visit.created_at)}</div>}</td></tr>)}</tbody></table></div>
        )}
        {!error && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-500"><span>{result.total} {query || source !== 'all' ? 'matching' : 'total'} entries</span><div className="flex items-center gap-3"><button aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-30"><ChevronLeft size={16} /></button><span>Page {page} of {pages}</span><button aria-label="Next page" disabled={page >= pages || loading} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-30"><ChevronRight size={16} /></button></div></div>}
      </div>
    </div>
  )
}
