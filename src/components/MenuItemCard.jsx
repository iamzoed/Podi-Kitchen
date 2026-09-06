import { useState } from 'react'
import { ChevronDown, Flame, Minus, Plus, Check, ShoppingCart, Share2 } from 'lucide-react'
import { spiceLevels } from '../data/menu'
import { categoryAccents } from '../data/categoryAccents'
import { computeLinePrice, whatsAppShareLink } from '../utils/order'

const AVAILABILITY_BADGE = {
  LIMITED: { label: 'Limited', className: 'bg-amber-500 text-white' },
  SOLD_OUT: { label: 'Sold Out', className: 'bg-gray-700 text-white' },
}

export default function MenuItemCard({ item, onAdd, availability = 'AVAILABLE', orderingClosed = false }) {
  const accent = categoryAccents[item.category]
  const [variantId, setVariantId] = useState(item.variants[0].id)
  const [addonIds, setAddonIds] = useState([])
  const [spiceLevel, setSpiceLevel] = useState(item.allowSpiceLevel ? spiceLevels[1] : null)
  const [qty, setQty] = useState(1)
  const [open, setOpen] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  const soldOut = availability === 'SOLD_OUT'
  const canOrder = !soldOut && !orderingClosed
  const badge = AVAILABILITY_BADGE[availability]

  const variant = item.variants.find((v) => v.id === variantId)
  const unitPrice = computeLinePrice(item, variant, addonIds)

  function toggleAddon(id) {
    setAddonIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]))
  }

  function handleShare(e) {
    e.stopPropagation()
    const url = typeof window !== 'undefined' ? window.location.origin : ''
    const message = `Check out ${item.name} at Podi Kitchen 🍽️ — ${item.description} Starting at ₹${item.basePrice}. ${url}`
    window.open(whatsAppShareLink(message), '_blank')
  }

  function handleAdd(e) {
    onAdd(
      {
        menuItem: item,
        variant,
        addons: item.addons.filter((a) => addonIds.includes(a.id)),
        spiceLevel,
        qty,
        unitPrice,
      },
      e.currentTarget
    )
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1200)
    setQty(1)
    setAddonIds([])
  }

  return (
    <div
      className={`group border border-brick-100 rounded-2xl bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden ${
        soldOut ? 'opacity-70 saturate-50' : ''
      }`}
    >
      <button className="w-full text-left block" onClick={() => setOpen((o) => !o)}>
        <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-brick-100 to-brick-50">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-6xl">{item.emoji}</span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0" />

          {item.popular && (
            <span
              className="absolute top-3 left-3 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide bg-gold-500 text-white px-2.5 py-1 rounded-full animate-[badgeGlow_2.2s_ease-in-out_infinite]"
            >
              ★ Popular
            </span>
          )}
          <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
            <span className={`text-sm font-bold ${accent.text} bg-white/95 px-2.5 py-1 rounded-full shadow`}>
              ₹{item.basePrice}+
            </span>
            {badge && (
              <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shadow ${badge.className}`}>
                {badge.label}
              </span>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {item.veg && (
                <span
                  className="shrink-0 w-4 h-4 border-2 border-green-500 bg-white rounded-sm flex items-center justify-center"
                  title="Vegetarian"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                </span>
              )}
              <h3 className="font-heading font-semibold text-white text-lg drop-shadow-sm truncate">{item.name}</h3>
            </div>
            <ChevronDown
              size={20}
              className={`text-white drop-shadow-sm transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </button>
      <div className="flex items-start justify-between gap-2 px-4 py-3">
        <button className="flex-1 text-left" onClick={() => setOpen((o) => !o)}>
          <p className="text-sm text-gray-500">{item.description}</p>
        </button>
        <button
          onClick={handleShare}
          aria-label={`Share ${item.name} on WhatsApp`}
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors duration-150"
        >
          <Share2 size={15} />
        </button>
      </div>

      <div
        inert={!open}
        className={`grid transition-all duration-300 ease-in-out ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-brick-100 p-4 space-y-4 bg-brick-50/40">
            {item.variants.length > 1 && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1.5">Size</div>
                <div className="flex flex-wrap gap-2">
                  {item.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVariantId(v.id)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all duration-150 ${
                        v.id === variantId
                          ? `${accent.dot} text-white ${accent.border} shadow-sm`
                          : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-white'
                      }`}
                    >
                      {v.name} {v.priceDelta ? `(+₹${v.priceDelta})` : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {item.allowSpiceLevel && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1.5">Spice level</div>
                <div className="flex flex-wrap gap-2">
                  {spiceLevels.map((s, i) => (
                    <button
                      key={s}
                      onClick={() => setSpiceLevel(s)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition-all duration-150 ${
                        s === spiceLevel
                          ? `${accent.dot} text-white ${accent.border} shadow-sm`
                          : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-white'
                      }`}
                    >
                      {Array.from({ length: i + 1 }).map((_, f) => (
                        <Flame key={f} size={12} className={s === spiceLevel ? 'fill-white' : 'fill-orange-300 text-orange-300'} />
                      ))}
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {item.addons.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1.5">Add-ons</div>
                <div className="flex flex-wrap gap-2">
                  {item.addons.map((a) => {
                    const selected = addonIds.includes(a.id)
                    return (
                      <label
                        key={a.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border cursor-pointer transition-all duration-150 ${
                          selected
                            ? `${accent.dot} text-white ${accent.border} shadow-sm`
                            : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={selected}
                          onChange={() => toggleAddon(a.id)}
                        />
                        {selected && <Check size={14} />}
                        {a.name} (+₹{a.price})
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center border border-gray-300 rounded-full bg-white">
                <button
                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-brick-600"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-sm font-medium">{qty}</span>
                <button
                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-brick-600"
                  onClick={() => setQty((q) => q + 1)}
                >
                  <Plus size={14} />
                </button>
              </div>
              <button
                onClick={handleAdd}
                disabled={!canOrder}
                className={`flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-150 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-md disabled:cursor-not-allowed ${
                  justAdded ? 'bg-green-600' : !canOrder ? 'bg-gray-400' : `bg-gradient-to-r ${accent.grad}`
                }`}
              >
                {justAdded ? (
                  <Check size={16} />
                ) : (
                  <ShoppingCart size={16} />
                )}
                {justAdded
                  ? 'Added'
                  : soldOut
                    ? 'Sold Out'
                    : orderingClosed
                      ? 'Orders Closed'
                      : `Add · ₹${unitPrice * qty}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
