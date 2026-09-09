// Real bestseller data only — driven entirely by each item's own `popular`
// flag (same flag the "Popular" filter chip and card badge already use),
// never invented. Renders nothing if no items happen to be flagged.
export default function PopularToday({ items, onSelect }) {
  const popular = items.filter((m) => m.popular)
  if (popular.length === 0) return null

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6">
      <h2 className="font-heading text-lg font-semibold text-brick-800 mb-3 flex items-center gap-1.5">
        <span aria-hidden="true">🔥</span> Popular Today
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scroll-px-4">
        {popular.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.category)}
            className="shrink-0 w-28 sm:w-32 snap-start text-left group"
          >
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-brick-50 shadow-sm group-hover:shadow-md transition-shadow duration-200">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-4xl">{item.emoji}</span>
              )}
            </div>
            <div className="mt-1.5 text-sm font-semibold text-gray-800 truncate">{item.name}</div>
            <div className="text-xs text-brick-700 font-bold">₹{item.basePrice}+</div>
          </button>
        ))}
      </div>
    </div>
  )
}
