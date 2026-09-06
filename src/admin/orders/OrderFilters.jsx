import { Search, ArrowUpDown } from 'lucide-react'
import { ORDER_STATUS, ORDER_STATUS_LABEL } from '../../data/orderConstants'

function startOfDay(daysAgo = 0) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - daysAgo)
  return d
}

export default function OrderFilters({ filters, onChange }) {
  function setDatePreset(preset) {
    if (preset === 'today') {
      onChange({ ...filters, datePreset: 'today', dateFrom: startOfDay(0).toISOString(), dateTo: null })
    } else if (preset === 'yesterday') {
      onChange({
        ...filters,
        datePreset: 'yesterday',
        dateFrom: startOfDay(1).toISOString(),
        dateTo: startOfDay(0).toISOString(),
      })
    } else if (preset === 'all') {
      onChange({ ...filters, datePreset: 'all', dateFrom: null, dateTo: null })
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          placeholder="Search order #, name, or phone"
          className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brick-300"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['today', 'yesterday', 'all'].map((preset) => (
          <button
            key={preset}
            onClick={() => setDatePreset(preset)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border ${
              filters.datePreset === preset
                ? 'bg-brick-600 text-white border-brick-600'
                : 'border-gray-300 text-gray-600'
            }`}
          >
            {preset === 'today' ? 'Today' : preset === 'yesterday' ? 'Yesterday' : 'All time'}
          </button>
        ))}

        <input
          type="date"
          className="shrink-0 border rounded-full px-3 py-1.5 text-xs text-gray-600"
          onChange={(e) => {
            if (!e.target.value) return
            const from = new Date(e.target.value)
            from.setHours(0, 0, 0, 0)
            const to = new Date(from)
            to.setDate(to.getDate() + 1)
            onChange({ ...filters, datePreset: 'custom', dateFrom: from.toISOString(), dateTo: to.toISOString() })
          }}
        />

        <select
          className="shrink-0 border rounded-full px-3 py-1.5 text-xs text-gray-600 bg-white"
          value={filters.status || ''}
          onChange={(e) => onChange({ ...filters, status: e.target.value || null })}
        >
          <option value="">All statuses</option>
          {Object.values(ORDER_STATUS).map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABEL[s]}
            </option>
          ))}
        </select>

        <button
          onClick={() => onChange({ ...filters, sortAsc: !filters.sortAsc })}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-gray-300 text-gray-600"
        >
          <ArrowUpDown size={12} />
          {filters.sortAsc ? 'Oldest first' : 'Newest first'}
        </button>
      </div>
    </div>
  )
}
