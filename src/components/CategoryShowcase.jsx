import { CircleDot, IceCreamCone, LayoutGrid, UtensilsCrossed, Soup, Coffee } from 'lucide-react'
import { categoryAccents } from '../data/categoryAccents'

const ICONS = { CircleDot, IceCreamCone, LayoutGrid, UtensilsCrossed, Soup, Coffee }

export default function CategoryShowcase({ categories, items, active, onSelect }) {
  return (
    <div className="bg-white border-b">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex gap-4 overflow-x-auto pb-1">
          {categories.map((c) => {
            const sample = items.find((m) => m.category === c.id)
            const accent = categoryAccents[c.id]
            const Icon = ICONS[c.icon]
            const isActive = c.id === active
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className="flex flex-col items-center gap-1.5 shrink-0 w-16"
              >
                <span
                  className={`w-16 h-16 rounded-full overflow-hidden border-[3px] transition-all duration-200 ${
                    isActive ? `${accent.border} scale-105` : 'border-transparent'
                  }`}
                >
                  {sample?.image ? (
                    <img src={sample.image} alt={c.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className={`w-full h-full flex items-center justify-center text-2xl ${accent.bgSoft}`}>
                      {sample?.emoji || (Icon && <Icon size={22} className={accent.text} />)}
                    </span>
                  )}
                </span>
                <span className={`text-[11px] font-medium text-center leading-tight ${isActive ? accent.text : 'text-gray-600'}`}>
                  {c.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
