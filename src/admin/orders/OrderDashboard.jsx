import { useState } from 'react'
import { Loader2, AlertCircle, PackageOpen } from 'lucide-react'
import { useOrders } from './useOrders'
import { useOrderCounters } from './useOrderCounters'
import OrderCounters from './OrderCounters'
import OrderFilters from './OrderFilters'
import OrderCard from './OrderCard'
import OrderDetailModal from './OrderDetailModal'

const DEFAULT_FILTERS = { status: null, dateFrom: null, dateTo: null, datePreset: 'all', search: '', sortAsc: false }

export default function OrderDashboard() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const { orders, loading, loadingMore, error, hasMore, loadMore } = useOrders(filters)
  const { counts } = useOrderCounters()

  function selectCounterStatus(status) {
    setFilters((f) => ({ ...f, status }))
  }

  return (
    <div className="space-y-4">
      <OrderCounters counts={counts} activeStatus={filters.status} onSelectStatus={selectCounterStatus} />
      <OrderFilters filters={filters} onChange={setFilters} />

      {error && (
        <div className="flex items-center gap-1.5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <AlertCircle size={14} className="shrink-0" /> Couldn't load orders: {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
          <PackageOpen size={32} strokeWidth={1.5} />
          <p className="text-sm">No orders match these filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onOpen={setSelectedOrder} />
          ))}
        </div>
      )}

      {!loading && hasMore && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          {loadingMore ? 'Loading…' : 'Load more'}
        </button>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onChanged={(updated) => setSelectedOrder(updated)}
        />
      )}
    </div>
  )
}
