import { ChefHat } from 'lucide-react'

// "Today's Preparation" — the current confirmed workload, order-based
// counts only (no ingredient/batter/sambar quantities, that needs real
// recipes and comes in a later phase).
//
// Calculation logic:
//  - Counts CONFIRMED + PREPARING orders only — these still need cooking.
//  - Excludes PACKED (already made — this is what's *left* to prepare, not
//    a running total of everything ordered today) and OUT_FOR_DELIVERY/
//    DELIVERED (long since done).
//  - Excludes REJECTED and CANCELLED entirely — never counted as workload,
//    at any point (this hook's own fetch never even requests those
//    statuses, so there's no separate filtering needed for them here).
//  - Recomputes on every realtime order change (see useKitchenOrders), so
//    confirming/packing/cancelling an order updates this immediately.
//  - This is a *different* number from the Capacity tab's "reserved"
//    count, which includes every accepted order regardless of prep status
//    — that answers "how much of today's capacity is booked," this answers
//    "what does the kitchen still need to cook right now."
function aggregate(orders, itemsByOrder) {
  const relevant = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PREPARING')
  const summary = {}
  for (const order of relevant) {
    for (const item of itemsByOrder[order.id] || []) {
      const name = item.item_name_snapshot
      const size = item.size_label || 'Regular'
      summary[name] ||= {}
      summary[name][size] = (summary[name][size] || 0) + item.quantity
    }
  }
  return summary
}

export default function ProductionSummary({ orders, itemsByOrder }) {
  const summary = aggregate(orders, itemsByOrder)
  const items = Object.entries(summary)

  if (items.length === 0) {
    return (
      <div className="bg-white border rounded-xl p-4 text-center text-sm text-gray-400">
        Nothing waiting to be prepared right now.
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-xl p-3">
      <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
        <ChefHat size={14} /> Today's Preparation
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map(([name, sizes]) => {
          const sizeEntries = Object.entries(sizes)
          const singleSize = sizeEntries.length === 1
          return (
            <div key={name} className="bg-brick-50 rounded-lg p-2.5">
              <div className="text-xs font-bold text-brick-800 uppercase tracking-wide truncate">{name}</div>
              {singleSize ? (
                <div className="text-2xl font-extrabold text-brick-700 leading-tight mt-0.5">{sizeEntries[0][1]}</div>
              ) : (
                <div className="mt-1 space-y-0.5">
                  {sizeEntries.map(([size, qty]) => (
                    <div key={size} className="flex justify-between text-sm text-brick-700">
                      <span className="text-gray-600">{size}</span>
                      <span className="font-bold">{qty}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
