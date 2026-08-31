import { useState } from 'react'
import { spiceLevels } from '../data/menu'
import { computeLinePrice } from '../utils/order'

export default function MenuItemCard({ item, onAdd }) {
  const [variantId, setVariantId] = useState(item.variants[0].id)
  const [addonIds, setAddonIds] = useState([])
  const [spiceLevel, setSpiceLevel] = useState(item.allowSpiceLevel ? spiceLevels[1] : null)
  const [qty, setQty] = useState(1)
  const [open, setOpen] = useState(false)

  const variant = item.variants.find((v) => v.id === variantId)
  const unitPrice = computeLinePrice(item, variant, addonIds)

  function toggleAddon(id) {
    setAddonIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]))
  }

  function handleAdd() {
    onAdd({
      menuItem: item,
      variant,
      addons: item.addons.filter((a) => addonIds.includes(a.id)),
      spiceLevel,
      qty,
      unitPrice,
    })
    setOpen(false)
    setQty(1)
    setAddonIds([])
  }

  return (
    <div className="border border-brick-100 rounded-xl bg-white shadow-sm overflow-hidden">
      <button
        className="w-full text-left p-4 flex justify-between items-start gap-3"
        onClick={() => setOpen((o) => !o)}
      >
        <div>
          <h3 className="font-semibold text-brick-700">{item.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{item.description}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-semibold text-brick-600">₹{item.basePrice}+</div>
          <div className="text-xs text-gray-400 mt-1">{open ? 'Close' : 'Customize'}</div>
        </div>
      </button>

      {open && (
        <div className="border-t border-brick-100 p-4 space-y-4 bg-brick-50/40">
          {item.variants.length > 1 && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Size</div>
              <div className="flex flex-wrap gap-2">
                {item.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVariantId(v.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border ${
                      v.id === variantId
                        ? 'bg-brick-600 text-white border-brick-600'
                        : 'border-gray-300 text-gray-600'
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
              <div className="text-xs font-medium text-gray-500 mb-1">Spice level</div>
              <div className="flex flex-wrap gap-2">
                {spiceLevels.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpiceLevel(s)}
                    className={`px-3 py-1.5 rounded-full text-sm border ${
                      s === spiceLevel
                        ? 'bg-brick-600 text-white border-brick-600'
                        : 'border-gray-300 text-gray-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {item.addons.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Add-ons</div>
              <div className="flex flex-wrap gap-2">
                {item.addons.map((a) => (
                  <label
                    key={a.id}
                    className={`px-3 py-1.5 rounded-full text-sm border cursor-pointer ${
                      addonIds.includes(a.id)
                        ? 'bg-brick-600 text-white border-brick-600'
                        : 'border-gray-300 text-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={addonIds.includes(a.id)}
                      onChange={() => toggleAddon(a.id)}
                    />
                    {a.name} (+₹{a.price})
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center border border-gray-300 rounded-full">
              <button
                className="w-8 h-8 text-gray-600"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span className="w-6 text-center text-sm">{qty}</span>
              <button className="w-8 h-8 text-gray-600" onClick={() => setQty((q) => q + 1)}>
                +
              </button>
            </div>
            <button
              onClick={handleAdd}
              className="bg-brick-600 hover:bg-brick-700 text-white text-sm font-medium px-4 py-2 rounded-full"
            >
              Add · ₹{unitPrice * qty}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
