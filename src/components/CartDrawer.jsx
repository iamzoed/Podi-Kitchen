import { useState } from 'react'
import { cartTotal, whatsAppOrderLink } from '../utils/order'
import { shopInfo } from '../data/menu'

export default function CartDrawer({ lines, onRemove, onClose }) {
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '', notes: '' })
  const total = cartTotal(lines)
  const canOrder = lines.length > 0 && customer.name && customer.phone && customer.address

  function handleOrder() {
    if (!canOrder) return
    const link = whatsAppOrderLink({ lines, customer, shopInfo })
    window.open(link, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold text-brick-700">Your order</h2>
          <button onClick={onClose} className="text-gray-400 text-xl leading-none">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {lines.length === 0 && <p className="text-sm text-gray-400">Your cart is empty.</p>}
          {lines.map((line, i) => (
            <div key={i} className="border rounded-lg p-3 text-sm">
              <div className="flex justify-between font-medium">
                <span>
                  {line.menuItem.name} ({line.variant.name}) × {line.qty}
                </span>
                <span>₹{line.unitPrice * line.qty}</span>
              </div>
              {line.spiceLevel && <div className="text-gray-500 text-xs mt-1">Spice: {line.spiceLevel}</div>}
              {line.addons.length > 0 && (
                <div className="text-gray-500 text-xs mt-1">
                  Add-ons: {line.addons.map((a) => a.name).join(', ')}
                </div>
              )}
              <button onClick={() => onRemove(i)} className="text-brick-600 text-xs mt-2 underline">
                Remove
              </button>
            </div>
          ))}
        </div>

        {lines.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>₹{total}</span>
            </div>

            <div className="space-y-2">
              <input
                placeholder="Your name"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              />
              <input
                placeholder="Phone number"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              />
              <textarea
                placeholder="Delivery address"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                rows={2}
                value={customer.address}
                onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
              />
              <textarea
                placeholder="Notes (optional)"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                rows={1}
                value={customer.notes}
                onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
              />
            </div>

            <button
              disabled={!canOrder}
              onClick={handleOrder}
              className="w-full bg-brick-600 hover:bg-brick-700 disabled:bg-gray-300 text-white font-medium py-3 rounded-full"
            >
              Send order on WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
