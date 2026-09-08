import { useEffect, useState } from 'react'
import { X, Trash2, ShoppingBag, Flame, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { cartTotal, whatsAppOrderLink, whatsAppShareLink, createOrder } from '../utils/order'
import { shopInfo } from '../data/menu'
import { WhatsAppIcon } from './SocialIcons'
import { useEscapeToClose } from '../hooks/useEscapeToClose'
import DeliveryLocation from './DeliveryLocation'
import { checkDeliveryEligibility, deliveryRadiusBlocks } from '../utils/location'
import { validateCustomer } from '../utils/validation'

function shareAppMessage() {
  const url = typeof window !== 'undefined' ? window.location.origin : ''
  return `I just ordered from ${shopInfo.name} 🍽️ — homemade South Indian breakfast delivered fresh in ${shopInfo.city}! Check them out: ${url}`
}

export default function CartDrawer({ lines, onRemove, isOpen, onClose, profile, onSaveProfile, onOrderPlaced }) {
  useEscapeToClose(onClose, isOpen)
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '', landmark: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [placedOrder, setPlacedOrder] = useState(null) // { orderNumber, link } — only set if the WhatsApp popup got blocked
  const [orderSuccess, setOrderSuccess] = useState(null) // { orderNumber } — set once the WhatsApp handoff (popup or fallback link) has happened
  const [location, setLocation] = useState(null) // { lat, lng, accuracy, resolvedAddress } — only set via an explicit "Use my current location" tap
  const [autoFilledAddress, setAutoFilledAddress] = useState(null) // tracks what we wrote into the address field from GPS, so a manual edit can invalidate the pin
  const [touched, setTouched] = useState(false) // only show field-level errors after a first submit attempt, not while the form is still empty/fresh
  const total = cartTotal(lines)
  const belowMinOrder = shopInfo.minOrder > 0 && total < shopInfo.minOrder
  const outsideRadius = Boolean(
    deliveryRadiusBlocks && location && !checkDeliveryEligibility(location.lat, location.lng).withinRadius
  )
  const { valid: customerValid, errors: fieldErrors } = validateCustomer(customer)
  // Only the non-field conditions actually disable the button — an invalid
  // field stays clickable so tapping it reveals exactly what's wrong
  // (via `touched`) rather than leaving the customer guessing why a
  // disabled button won't respond.
  const canAttemptOrder = lines.length > 0 && !belowMinOrder && !outsideRadius

  // Prefill from a saved profile once, so it doesn't clobber what the
  // customer is actively typing on later renders.
  useEffect(() => {
    if (profile && (profile.name || profile.phone || profile.address)) {
      setCustomer((c) => ({
        ...c,
        name: c.name || profile.name || '',
        phone: c.phone || profile.phone || '',
        address: c.address || profile.address || '',
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  function handleLocationChange(newLocation) {
    setLocation(newLocation)
    if (newLocation?.resolvedAddress) {
      setCustomer((c) => ({ ...c, address: newLocation.resolvedAddress }))
      setAutoFilledAddress(newLocation.resolvedAddress)
    } else {
      // Either cleared, or GPS succeeded without a resolvable address — in
      // the latter case there's no auto-filled text to compare edits
      // against, so we keep the coordinates no matter what the customer
      // types (they still represent where the phone actually was).
      setAutoFilledAddress(null)
    }
  }

  function handleAddressChange(value) {
    setCustomer((c) => ({ ...c, address: value }))
    // The pin was tied to specific auto-filled text — if that text no
    // longer matches, the pin may no longer match either. Clear it rather
    // than risk sending a mismatched location (spec: never send misleading
    // coordinates alongside a manually changed address).
    if (location && autoFilledAddress != null && value !== autoFilledAddress) {
      setLocation(null)
      setAutoFilledAddress(null)
    }
  }

  async function handleOrder() {
    if (!canAttemptOrder || submitting) return
    if (!customerValid) {
      setTouched(true)
      return
    }
    setSubmitting(true)
    setOrderError('')
    setPlacedOrder(null)

    const { order, error } = await createOrder({ lines, customer, userId: profile?.id, location })

    if (error || !order) {
      setSubmitting(false)
      setOrderError(error?.message || 'Something went wrong saving your order. Please try again.')
      return
    }

    const link = whatsAppOrderLink({ lines, customer, shopInfo, orderNumber: order.order_number, location })
    const win = window.open(link, '_blank')
    setSubmitting(false)

    if (onSaveProfile) {
      onSaveProfile({ name: customer.name, phone: customer.phone, address: customer.address })
    }

    if (win) {
      setOrderSuccess({ orderNumber: order.order_number })
    } else {
      // The order is already safely saved even though the popup was
      // blocked — never re-create it, just let the customer finish the
      // handoff manually.
      setPlacedOrder({ orderNumber: order.order_number, link })
    }
  }

  function handleFallbackWhatsAppClick() {
    setOrderSuccess({ orderNumber: placedOrder.orderNumber })
    setPlacedOrder(null)
  }

  function handleDone() {
    setOrderSuccess(null)
    onOrderPlaced?.()
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
        className={`absolute right-0 top-0 w-full max-w-md bg-white h-full shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold text-brick-700 flex items-center gap-2">
            <ShoppingBag size={18} /> Your order
          </h2>
          <button onClick={onClose} aria-label="Close cart" className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {orderSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 p-6">
            <CheckCircle2 size={48} className="text-emerald-500" />
            <div>
              <p className="font-heading text-lg font-semibold text-gray-800">Order #{orderSuccess.orderNumber} placed!</p>
              <p className="text-sm text-gray-500 mt-1">Sent to us on WhatsApp — we'll confirm shortly.</p>
            </div>
            <a
              href={whatsAppShareLink(shareAppMessage())}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all duration-150 mt-2"
            >
              <WhatsAppIcon className="w-4 h-4" />
              Share {shopInfo.name} with friends
            </a>
            <button onClick={handleDone} className="text-sm text-gray-400 hover:text-gray-600 underline mt-1">
              Continue browsing
            </button>
          </div>
        ) : (
          <>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {lines.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <ShoppingBag size={32} strokeWidth={1.5} />
              <p className="text-sm">Your cart is empty.</p>
            </div>
          )}
          {lines.map((line, i) => (
            <div key={i} className="border rounded-xl p-3 text-sm animate-[fadeIn_0.2s_ease-in]">
              <div className="flex justify-between font-medium">
                <span>
                  {line.menuItem.name} ({line.variant.name}) × {line.qty}
                </span>
                <span>₹{line.unitPrice * line.qty}</span>
              </div>
              {line.spiceLevel && (
                <div className="flex items-center gap-1 text-gray-500 text-xs mt-1.5">
                  <Flame size={12} className="fill-orange-300 text-orange-300" /> {line.spiceLevel}
                </div>
              )}
              {line.addons.length > 0 && (
                <div className="text-gray-500 text-xs mt-1">
                  Add-ons: {line.addons.map((a) => a.name).join(', ')}
                </div>
              )}
              <button
                onClick={() => onRemove(i)}
                className="flex items-center gap-1 text-brick-600 text-xs mt-2 hover:text-brick-700"
              >
                <Trash2 size={12} /> Remove
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

            {belowMinOrder && (
              <div className="flex items-center gap-1.5 text-xs text-brick-700 bg-brick-50 border border-brick-100 rounded-lg px-3 py-2">
                <AlertCircle size={14} className="shrink-0" />
                Add ₹{shopInfo.minOrder - total} more to reach the ₹{shopInfo.minOrder} minimum order.
              </div>
            )}

            {outsideRadius && (
              <div className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <AlertCircle size={14} className="shrink-0" />
                This location is outside our current delivery area. Please double-check your address, or contact us directly.
              </div>
            )}

            {placedOrder && (
              <div className="flex flex-col gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 size={14} className="shrink-0" />
                  Order #{placedOrder.orderNumber} saved. Your browser blocked the WhatsApp popup — tap below to send it.
                </span>
                <a
                  href={placedOrder.link}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleFallbackWhatsAppClick}
                  className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white text-sm font-semibold py-2 rounded-full"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  Open WhatsApp
                </a>
              </div>
            )}

            {orderError && (
              <div className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <AlertCircle size={14} className="shrink-0" />
                {orderError}
              </div>
            )}

            <div className="space-y-2">
              <div>
                <input
                  placeholder="Your name"
                  maxLength={100}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    touched && fieldErrors.name ? 'border-red-300 focus:ring-red-200' : 'focus:ring-brick-300'
                  }`}
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                />
                {touched && fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
              </div>

              <div>
                <input
                  placeholder="Phone number"
                  inputMode="tel"
                  maxLength={16}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    touched && fieldErrors.phone ? 'border-red-300 focus:ring-red-200' : 'focus:ring-brick-300'
                  }`}
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                />
                {touched && fieldErrors.phone && <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>}
              </div>

              <DeliveryLocation location={location} onChange={handleLocationChange} />

              <div>
                <textarea
                  placeholder="Delivery address"
                  maxLength={300}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    touched && fieldErrors.address ? 'border-red-300 focus:ring-red-200' : 'focus:ring-brick-300'
                  }`}
                  rows={2}
                  value={customer.address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                />
                {touched && fieldErrors.address && <p className="text-xs text-red-600 mt-1">{fieldErrors.address}</p>}
              </div>

              <input
                placeholder="Landmark (optional)"
                maxLength={100}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brick-300"
                value={customer.landmark}
                onChange={(e) => setCustomer({ ...customer, landmark: e.target.value })}
              />
              <textarea
                placeholder="Notes (optional)"
                maxLength={300}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brick-300"
                rows={1}
                value={customer.notes}
                onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
              />
            </div>

            <button
              disabled={!canAttemptOrder || submitting}
              onClick={handleOrder}
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] disabled:bg-gray-300 text-white font-semibold py-3 rounded-full shadow-md hover:shadow-lg transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 disabled:hover:translate-y-0 disabled:shadow-none"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Placing order…
                </>
              ) : (
                <>
                  <WhatsAppIcon className="w-5 h-5" />
                  Send order on WhatsApp
                </>
              )}
            </button>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  )
}
