import { CircleDot, IceCreamCone, LayoutGrid, UtensilsCrossed, Soup, Coffee } from 'lucide-react'
import { categoryAccents } from '../data/categoryAccents'

const ICONS = { CircleDot, IceCreamCone, LayoutGrid, UtensilsCrossed, Soup, Coffee }

export default function CategoryNav({ categories, active, onSelect }) {
  return (
    <nav className="sticky top-0 bg-white/90 backdrop-blur border-b z-10">
      <div className="max-w-3xl mx-auto px-4 flex gap-2 overflow-x-auto py-3">
        {categories.map((c) => {
          const Icon = ICONS[c.icon]
          const isActive = c.id === active
          const accent = categoryAccents[c.id]
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-all duration-150 ${
                isActive
                  ? `${accent.navActive} text-white shadow-sm scale-105`
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {Icon && <Icon size={16} strokeWidth={2} />}
              {c.name}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
