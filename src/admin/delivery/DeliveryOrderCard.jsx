import { useState } from 'react'
import { Loader2, Phone, Navigation, MapPin } from 'lucide-react'
import { updateOrderStatus } from '../orders/orderActions'
import { googleMapsLink } from '../../utils/location'

const ACTION = {
  PACKED: { next: 'OUT_FOR_DELIVERY', label: 'Start Delivery' },
  OUT_FOR_DELIVERY: { next: 'DELIVERED', label: 'Mark Delivered' },
}

export default function DeliveryOrderCard({ order, items, onChanged }) {
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

  // Precise coordinates when the customer used "Use my current location" at
  // checkout, otherwise the same address-search link as before — the
  // delivery person never needs to copy/paste anything either way.
  const hasCoords = order.delivery_latitude != null && order.delivery_longitude != null
  const mapsUrl = hasCoords
    ? googleMapsLink(order.delivery_latitude, order.delivery_longitude)
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${order.delivery_address}${order.landmark ? ', ' + order.landmark : ''}`
      )}`

  return (
    <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-bold text-brick-700 text-base">#{order.order_number}</span>
        <span className="font-bold text-gray-800">₹{order.total}</span>
      </div>

      <div className="font-semibold text-gray-800">{order.customer_name}</div>
      <div className="text-sm text-gray-600 flex items-start gap-1.5">
        <MapPin size={14} className="shrink-0 mt-0.5" />
        <span>
          {order.delivery_address}
          {order.landmark && <span className="text-gray-400"> · {order.landmark}</span>}
        </span>
      </div>

      <div className="text-xs text-gray-500">
        {items.length} item{items.length !== 1 ? 's' : ''} · {order.payment_method}
        {order.payment_status !== 'NOT_REQUIRED' ? ` · ${order.payment_status}` : ''}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <a
          href={`tel:${order.customer_phone}`}
          className="flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm py-2.5 rounded-xl"
        >
          <Phone size={15} /> Call
        </a>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm py-2.5 rounded-xl"
        >
          <Navigation size={15} /> Navigate
        </a>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {action && (
        <button
          onClick={handleAction}
          disabled={busy}
          className="w-full bg-brick-600 hover:bg-brick-700 disabled:opacity-50 text-white font-bold text-base py-3.5 rounded-xl transition-colors duration-150"
        >
          {busy ? <Loader2 size={20} className="animate-spin mx-auto" /> : action.label}
        </button>
      )}
    </div>
  )
}
