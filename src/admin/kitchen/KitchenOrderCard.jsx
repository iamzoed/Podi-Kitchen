import { useState } from 'react'
import { Loader2, Flame, StickyNote } from 'lucide-react'
import { updateOrderStatus } from '../orders/orderActions'

const ACTION = {
  CONFIRMED: { next: 'PREPARING', label: 'Start Preparing' },
  PREPARING: { next: 'PACKED', label: 'Mark Packed' },
}

function timeStr(iso) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

// Deliberately shows none of: customer name, phone, address, price, payment
// info — kitchen only needs what's necessary to cook and pack correctly.
export default function KitchenOrderCard({ order, items, onChanged }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const action = ACTION[order.status]

  async function handleAction() {
    if (!action) return
    setBusy(true)
    setError('')
    const { order: updated, error, conflict } = await updateOrderStatus({
      orderId: order.id,
      expectedStatus: order.status,
      newStatus: action.next,
      columns: 'id, status',
    })
    setBusy(false)
    if (conflict) {
      setError('Someone already updated this order.')
      onChanged?.()
      return
    }
    if (error) {
      setError(error.message || 'Could not update. Please try again.')
      return
    }
    onChanged?.(updated)
  }

  return (
    <div className="bg-white border-2 border-gray-100 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-brick-700 text-base">#{order.order_number}</span>
        <span className="text-xs text-gray-400">{timeStr(order.created_at)}</span>
      </div>

      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="text-sm">
            <div className="font-semibold text-gray-800">
              {it.item_name_snapshot}
              {it.size_label ? ` · ${it.size_label}` : ''} × {it.quantity}
            </div>
            {(it.spice_level || (it.addons && it.addons.length > 0)) && (
              <div className="flex flex-wrap gap-2 mt-0.5">
                {it.spice_level && (
                  <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                    <Flame size={10} /> {it.spice_level}
                  </span>
                )}
                {it.addons?.map((a) => (
                  <span key={a.name} className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                    {a.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {order.order_notes && (
        <div className="flex items-start gap-1.5 text-xs text-amber-800 bg-amber-50 rounded-lg px-2.5 py-1.5 mt-3">
          <StickyNote size={12} className="shrink-0 mt-0.5" /> {order.order_notes}
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      {action && (
        <button
          onClick={handleAction}
          disabled={busy}
          className="w-full mt-3 bg-brick-600 hover:bg-brick-700 disabled:opacity-50 text-white font-bold text-base py-3.5 rounded-xl transition-colors duration-150"
        >
          {busy ? <Loader2 size={20} className="animate-spin mx-auto" /> : action.label}
        </button>
      )}
    </div>
  )
}
