import { useEffect, useState } from 'react'
import axios from 'axios'
import { Eye, X, Search, Filter, Package } from 'lucide-react'
import { formatPrice, API } from '../../lib/utils'

const STATUS_STYLES = {
  pending:    { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-400' },
  processing: { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-400' },
  shipped:    { bg: 'bg-brand-100',  text: 'text-brand-700',  dot: 'bg-brand-400' },
  delivered:  { bg: 'bg-emerald-100',text: 'text-emerald-700',dot: 'bg-emerald-400' },
  cancelled:  { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-400' },
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

const ALL_STATUSES = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled']

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [selected, setSelected] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [updating, setUpdating] = useState(false)

  const load = () => axios.get(`${API}/orders`).then(r => setOrders(r.data))
  useEffect(() => { load() }, [])

  const viewOrder = async (id) => {
    const { data } = await axios.get(`${API}/orders/${id}`)
    setSelected(data)
    setNewStatus(data.status)
  }

  const updateStatus = async () => {
    setUpdating(true)
    await axios.put(`${API}/orders/${selected.id}/status`, { status: newStatus })
    setUpdating(false)
    setSelected(null)
    load()
  }

  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_email.toLowerCase().includes(search.toLowerCase()) ||
      String(o.id).includes(search)
    const matchStatus = filterStatus === 'all' || o.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-5">
      <div>
        <p className="section-kicker">Fulfillment</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.04em] text-slate-900">Order desk</h1>
        <p className="text-slate-500 text-sm mt-1">{orders.length} total orders</p>
      </div>

      {/* Filters */}
      <div className="surface-panel p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or order ID..."
            className="input pl-9 text-sm" />
        </div>
        <div className="relative">
          <Filter size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="input pl-9 pr-4 text-sm appearance-none min-w-[160px]">
            {ALL_STATUSES.map(s => (
              <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="surface-panel overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Order', 'Customer', 'Phone', 'Amount', 'Status', 'Date', 'Action'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, i) => (
                  <tr key={o.id} className={`border-b border-slate-50 hover:bg-slate-50/80 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                    <td className="px-5 py-4">
                      <span className="font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg text-xs">#{o.id}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{o.customer_name}</div>
                      <div className="text-xs text-slate-400">{o.customer_email}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-xs">{o.customer_phone || '—'}</td>
                    <td className="px-5 py-4 font-bold text-slate-800">{formatPrice(o.total)}</td>
                    <td className="px-5 py-4"><StatusBadge status={o.status} /></td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => viewOrder(o.id)}
                        className="flex items-center gap-1.5 bg-brand-50 hover:bg-brand-100 text-brand-600 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors">
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl z-10">
              <div>
                <h3 className="font-extrabold text-lg text-slate-800">Order #{selected.id}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(selected.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button onClick={() => setSelected(null)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                <X size={18} className="text-slate-600" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Customer info */}
              <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Customer', selected.customer_name],
                  ['Phone', selected.customer_phone || '—'],
                  ['Email', selected.customer_email],
                  ['City', selected.city || '—'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                    <p className="font-semibold text-slate-800 truncate">{val}</p>
                  </div>
                ))}
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 mb-0.5">Address</p>
                  <p className="font-semibold text-slate-800">{selected.address}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Items Ordered</p>
                <div className="space-y-2">
                  {selected.items?.map(i => (
                    <div key={i.id} className="flex justify-between items-center bg-slate-50 rounded-xl px-4 py-3 text-sm">
                      <span className="text-slate-700 font-medium">{i.product_name}
                        <span className="text-slate-400 font-normal"> × {i.quantity}</span>
                      </span>
                      <span className="font-bold text-slate-800">{formatPrice(i.price * i.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-extrabold text-base mt-3 pt-3 border-t-2 border-dashed border-slate-200">
                  <span className="text-slate-700">Total</span>
                  <span className="text-brand-700">{formatPrice(selected.total)}</span>
                </div>
              </div>

              {/* Update status */}
              <div className="bg-brand-50 rounded-2xl p-4 border border-brand-100">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Update Order Status</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => {
                    const st = STATUS_STYLES[s]
                    return (
                      <button key={s} onClick={() => setNewStatus(s)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border-2 transition-all ${
                          newStatus === s
                            ? `${st.bg} ${st.text} border-current`
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    )
                  })}
                </div>
                <button onClick={updateStatus} disabled={updating || newStatus === selected.status}
                  className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                  {updating ? 'Updating...' : 'Save Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
