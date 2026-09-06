import { Loader2, AlertCircle, Truck } from 'lucide-react'
import { useDeliveryOrders } from './useDeliveryOrders'
import DeliveryOrderCard from './DeliveryOrderCard'

const SECTIONS = [
  { status: 'PACKED', label: 'Ready for Delivery' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { status: 'DELIVERED', label: 'Delivered Today' },
]

export default function DeliveryDashboard() {
  const { orders, itemsByOrder, loading, error, reload } = useDeliveryOrders()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-400">
        <Loader2 size={24} className="animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
        <AlertCircle size={14} className="shrink-0" /> Couldn't load deliveries: {error}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
        <Truck size={28} strokeWidth={1.5} />
        <p className="text-sm">No deliveries right now.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {SECTIONS.map((section) => {
        const sectionOrders = orders.filter((o) => o.status === section.status)
        if (sectionOrders.length === 0) return null
        return (
          <div key={section.status}>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
              {section.label} ({sectionOrders.length})
            </h2>
            <div className="space-y-3">
              {sectionOrders.map((order) => (
                <DeliveryOrderCard
                  key={order.id}
                  order={order}
                  items={itemsByOrder[order.id] || []}
                  onChanged={reload}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
