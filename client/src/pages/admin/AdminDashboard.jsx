import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { ShoppingBag, Package, IndianRupee, Clock, ArrowRight, Eye, TriangleAlert } from 'lucide-react'
import { formatPrice, API } from '../../lib/utils'

const STATUS_STYLES = {
  pending:    { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-400' },
  processing: { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-400' },
  shipped:    { bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-400' },
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

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])

  useEffect(() => {
    axios.get(`${API}/admin/stats`).then(r => setStats(r.data))
    axios.get(`${API}/orders`).then(r => setOrders(r.data.slice(0, 6)))
  }, [])

  const cards = stats ? [
    {
      label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag,
      light: 'bg-blue-50', iconColor: 'text-blue-600',
      sub: 'All time orders'
    },
    {
      label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: IndianRupee,
      light: 'bg-emerald-50', iconColor: 'text-emerald-600',
      sub: 'Gross revenue'
    },
    {
      label: 'Total Products', value: stats.totalProducts, icon: Package,
      light: 'bg-brand-50', iconColor: 'text-brand-700',
      sub: 'Active listings'
    },
    {
      label: 'Pending Orders', value: stats.pendingOrders, icon: Clock,
      light: 'bg-amber-50', iconColor: 'text-amber-600',
      sub: 'Needs attention'
    },
    {
      label: 'Low Stock', value: stats.lowStockProducts + stats.outOfStockProducts, icon: TriangleAlert,
      light: 'bg-rose-50', iconColor: 'text-rose-600',
      sub: `${stats.outOfStockProducts} out of stock`
    },
  ] : []

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <p className="section-kicker">Operations overview</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.04em] text-slate-900">Supply desk</h1>
        <p className="text-slate-500 text-sm mt-1">A clear view of today&apos;s ordering activity and inventory signals.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
        {cards.map(({ label, value, icon: Icon, light, iconColor, sub }) => (
          <div key={label} className="surface-panel p-5 transition-transform hover:-translate-y-0.5">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 ${light} rounded-2xl flex items-center justify-center`}>
                <Icon size={22} className={iconColor} />
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                Live
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-800 mb-0.5">{value ?? '—'}</div>
            <div className="text-sm font-semibold text-slate-600">{label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="surface-panel overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800">Recent Orders</h2>
            <p className="text-xs text-slate-400 mt-0.5">Latest {orders.length} orders</p>
          </div>
          <Link to="/admin/orders"
            className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Order', 'Customer', 'Amount', 'Status', 'Date', ''].map(h => (
                    <th key={h} className="text-left px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <tr key={o.id} className={`border-b border-slate-50 hover:bg-slate-50/80 transition-colors ${i === orders.length - 1 ? 'border-0' : ''}`}>
                    <td className="px-6 py-4">
                      <span className="font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg text-xs">#{o.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{o.customer_name}</div>
                      <div className="text-xs text-slate-400">{o.customer_email}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">{formatPrice(o.total)}</td>
                    <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <Link to="/admin/orders" className="p-1.5 rounded-lg hover:bg-brand-50 text-slate-400 hover:text-brand-600 transition-colors inline-flex">
                        <Eye size={15} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
