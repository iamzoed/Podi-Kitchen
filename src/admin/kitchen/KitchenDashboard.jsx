import { Loader2, AlertCircle, ChefHat } from 'lucide-react'
import { useKitchenOrders } from './useKitchenOrders'
import ProductionSummary from './ProductionSummary'
import KitchenOrderCard from './KitchenOrderCard'

const SECTIONS = [
  { status: 'CONFIRMED', label: 'Waiting' },
  { status: 'PREPARING', label: 'Preparing' },
  { status: 'PACKED', label: 'Packed' },
]

export default function KitchenDashboard() {
  const { orders, itemsByOrder, loading, error, reload } = useKitchenOrders()

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
        <AlertCircle size={14} className="shrink-0" /> Couldn't load kitchen orders: {error}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <ProductionSummary orders={orders} itemsByOrder={itemsByOrder} />

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
          <ChefHat size={28} strokeWidth={1.5} />
          <p className="text-sm">No active orders right now.</p>
        </div>
      ) : (
        SECTIONS.map((section) => {
          const sectionOrders = orders.filter((o) => o.status === section.status)
          if (sectionOrders.length === 0) return null
          return (
            <div key={section.status}>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
                {section.label} ({sectionOrders.length})
              </h2>
              <div className="space-y-3">
                {sectionOrders.map((order) => (
                  <KitchenOrderCard
                    key={order.id}
                    order={order}
                    items={itemsByOrder[order.id] || []}
                    onChanged={reload}
                  />
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
