import { Phone, MapPin, Truck } from 'lucide-react'
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR, PAYMENT_STATUS } from '../../data/orderConstants'

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function OrderCard({ order, onOpen }) {
  const color = ORDER_STATUS_COLOR[order.status] || ORDER_STATUS_COLOR.PENDING_CONFIRMATION

  return (
    <button
      onClick={() => onOpen(order)}
      className="w-full text-left bg-white border rounded-xl p-3 flex flex-col gap-1.5 hover:shadow-md transition-shadow duration-150"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-brick-700 text-sm">#{order.order_number}</span>
        <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${color.bg} ${color.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
          {ORDER_STATUS_LABEL[order.status]}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-gray-800 text-sm truncate">{order.customer_name}</span>
        <span className="text-xs text-gray-400 shrink-0">{timeAgo(order.created_at)}</span>
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Phone size={11} className="shrink-0" /> {order.customer_phone}
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-500 truncate">
        <MapPin size={11} className="shrink-0" /> {order.delivery_address}
      </div>

      {order.delivery_person_name && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Truck size={11} className="shrink-0" /> {order.delivery_person_name}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t mt-1">
        <span className="text-xs text-gray-400">
          {order.payment_status !== PAYMENT_STATUS.NOT_REQUIRED && (
            <span className="mr-2">{order.payment_status}</span>
          )}
        </span>
        <span className="font-semibold text-gray-800 text-sm">₹{order.total}</span>
      </div>
    </button>
  )
}
