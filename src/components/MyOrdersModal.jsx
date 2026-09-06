import { X, Clock3, RotateCcw } from 'lucide-react'
import { useMyOrders } from '../hooks/useMyOrders'
import { reorderLineFromSnapshot } from '../utils/order'
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '../data/orderConstants'
import { useEscapeToClose } from '../hooks/useEscapeToClose'

function dateStr(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function MyOrdersModal({ userId, menu, onClose, onReorder }) {
  useEscapeToClose(onClose)
  const { orders, itemsByOrder, loading } = useMyOrders(userId)

  function handleReorder(order) {
    const items = itemsByOrder[order.id] || []
    const lines = items.map((it) => reorderLineFromSnapshot(it, menu)).filter(Boolean)
    if (lines.length === 0) {
      return
    }
    onReorder(lines, lines.length < items.length)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-[popIn_0.25s_ease-out]">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-heading font-semibold text-gray-800">Your Orders</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && <p className="text-center text-sm text-gray-400 py-6">Loading your orders…</p>}

          {!loading && orders.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-6">
              No past orders yet — once you place one, it'll show up here for easy reordering.
            </p>
          )}

          {!loading &&
            orders.map((order) => {
              const items = itemsByOrder[order.id] || []
              const color = ORDER_STATUS_COLOR[order.status] || ORDER_STATUS_COLOR.PENDING_CONFIRMATION
              const canReorder = items.some((it) => it.menu_item_id)
              return (
                <div key={order.id} className="border border-gray-100 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-brick-700 text-sm">#{order.order_number}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${color.bg} ${color.text}`}>
                      {ORDER_STATUS_LABEL[order.status] || order.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock3 size={12} /> {dateStr(order.created_at)}
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {items.map((it) => `${it.item_name_snapshot} x${it.quantity}`).join(', ')}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold text-gray-800">₹{order.total}</span>
                    {canReorder && (
                      <button
                        onClick={() => handleReorder(order)}
                        className="flex items-center gap-1.5 bg-brick-50 hover:bg-brick-100 text-brick-700 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors duration-150"
                      >
                        <RotateCcw size={13} /> Reorder
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
