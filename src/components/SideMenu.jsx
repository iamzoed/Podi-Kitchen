import { X, ShoppingBag, ChefHat, CircleDot, IceCreamCone, LayoutGrid, UtensilsCrossed, Soup, Coffee, Sparkles, User, LogOut, Receipt } from 'lucide-react'
import { shopInfo } from '../data/menu'
import { categoryAccents } from '../data/categoryAccents'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import { useEscapeToClose } from '../hooks/useEscapeToClose'

const ICONS = { CircleDot, IceCreamCone, LayoutGrid, UtensilsCrossed, Soup, Coffee }

export default function SideMenu({
  categories,
  active,
  onSelect,
  isOpen,
  onClose,
  itemCount,
  onOpenCart,
  user,
  onOpenAuth,
  onSignOut,
  onOpenMyOrders,
}) {
  useEscapeToClose(onClose, isOpen)

  function handleSelect(id) {
    onSelect(id)
    onClose()
  }

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      <div
        className={`absolute left-0 top-0 w-72 max-w-[85%] bg-white h-full shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="bg-gradient-to-br from-brick-600 to-brick-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center ring-1 ring-white/30">
              <ChefHat size={18} />
            </div>
            <div>
              <div className="font-heading font-semibold leading-tight">{shopInfo.name}</div>
              <div className="text-brick-100 text-xs">{shopInfo.city}</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close menu" className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          <div className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Menu
          </div>
          {categories.map((c) => {
            const Icon = ICONS[c.icon]
            const isActive = c.id === active
            const accent = categoryAccents[c.id]
            return (
              <button
                key={c.id}
                onClick={() => handleSelect(c.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors duration-150 border-l-4 ${
                  isActive
                    ? `${accent.border} ${accent.bgSoft} ${accent.text}`
                    : 'border-transparent text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${accent.dot}`} />
                {Icon && <Icon size={18} />}
                {c.name}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t space-y-3">
          <button
            onClick={() => {
              onOpenCart()
              onClose()
            }}
            className="w-full flex items-center justify-between gap-2 bg-brick-50 hover:bg-brick-100 text-brick-700 font-semibold px-4 py-3 rounded-full transition-colors duration-150"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag size={18} /> View Cart
            </span>
            {itemCount > 0 && (
              <span className="bg-brick-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>

          {isSupabaseConfigured && user && (
            <button
              onClick={() => {
                onOpenMyOrders()
                onClose()
              }}
              className="w-full flex items-center gap-2 border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold px-4 py-3 rounded-full transition-colors duration-150"
            >
              <Receipt size={18} /> Your Orders
            </button>
          )}

          {isSupabaseConfigured &&
            (user ? (
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 text-gray-600 truncate">
                  <User size={16} className="shrink-0" />
                  <span className="truncate">{user.email}</span>
                </span>
                <button
                  onClick={onSignOut}
                  aria-label="Sign out"
                  className="text-gray-400 hover:text-brick-600 shrink-0"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth()
                  onClose()
                }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-white font-semibold text-sm px-4 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all duration-150"
              >
                <User size={16} /> Sign in
              </button>
            ))}

          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 pt-1">
            <Sparkles size={12} className="text-gold-500" />
            Developed by <span className="font-semibold text-gray-600">Zoed Shaikh</span>
          </div>
        </div>
      </div>
    </div>
  )
}
