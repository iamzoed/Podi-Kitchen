import { Search, X, Leaf, Flame } from 'lucide-react'

export default function SearchAndFilters({ query, onQueryChange, vegOnly, onToggleVeg, popularOnly, onTogglePopular }) {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 pb-1 space-y-2.5">
      <div className="relative">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search for idli, dosa, chutney…"
          className="w-full bg-white border border-gray-200 rounded-full pl-10 pr-9 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brick-300 focus:border-brick-300"
        />
        {query && (
          <button
            onClick={() => onQueryChange('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleVeg}
          aria-pressed={vegOnly}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors duration-150 ${
            vegOnly ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <Leaf size={13} /> Veg only
        </button>
        <button
          onClick={onTogglePopular}
          aria-pressed={popularOnly}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors duration-150 ${
            popularOnly ? 'bg-gold-500 border-gold-500 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <Flame size={13} /> Popular
        </button>
      </div>
    </div>
  )
}
