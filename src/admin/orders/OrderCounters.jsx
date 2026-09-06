const TILES = [
  { key: 'PENDING_CONFIRMATION', label: 'New', color: 'text-amber-600 bg-amber-50' },
  { key: 'CONFIRMED', label: 'Confirmed', color: 'text-sky-600 bg-sky-50' },
  { key: 'PREPARING', label: 'Preparing', color: 'text-violet-600 bg-violet-50' },
  { key: 'PACKED', label: 'Packed', color: 'text-indigo-600 bg-indigo-50' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: 'text-orange-600 bg-orange-50' },
  { key: 'DELIVERED_TODAY', label: 'Delivered Today', color: 'text-emerald-600 bg-emerald-50' },
  { key: 'CANCELLED_REJECTED_TODAY', label: 'Cancelled/Rejected Today', color: 'text-gray-500 bg-gray-100' },
]

export default function OrderCounters({ counts, activeStatus, onSelectStatus }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {TILES.map((t) => {
        const isActive = t.key === activeStatus
        const clickable = !t.key.endsWith('_TODAY') // counters that don't map to a single filterable status
        return (
          <button
            key={t.key}
            disabled={!clickable}
            onClick={() => clickable && onSelectStatus(isActive ? null : t.key)}
            className={`shrink-0 rounded-xl px-3 py-2 text-left min-w-[92px] transition-all duration-150 ${t.color} ${
              isActive ? 'ring-2 ring-offset-1 ring-brick-500' : ''
            } ${clickable ? 'cursor-pointer' : 'cursor-default opacity-90'}`}
          >
            <div className="text-lg font-bold leading-none">{counts[t.key] ?? '—'}</div>
            <div className="text-[10px] font-medium mt-1 leading-tight">{t.label}</div>
          </button>
        )
      })}
    </div>
  )
}
