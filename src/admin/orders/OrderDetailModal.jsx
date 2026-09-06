import { useEffect, useState } from 'react'
import { X, Loader2, AlertCircle, Clock, Truck, MapPin } from 'lucide-react'
import { googleMapsLink } from '../../utils/location'
import {
  ORDER_STATUS,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
  ORDER_STATUS_TRANSITIONS,
} from '../../data/orderConstants'
import {
  fetchOrderItems,
  fetchOrderHistory,
  fetchOrder,
  updateOrderStatus,
  assignDeliveryUser,
  fetchDeliveryUsers,
} from './orderActions'

const ACTION_LABEL = {
  CONFIRMED: 'Confirm',
  REJECTED: 'Reject',
  PREPARING: 'Start Preparing',
  CANCELLED: 'Cancel',
  PACKED: 'Mark Packed',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Mark Delivered',
}

const REASON_REQUIRED = new Set(['REJECTED', 'CANCELLED'])

export default function OrderDetailModal({ order: initialOrder, onClose, onChanged }) {
  const [order, setOrder] = useState(initialOrder)
  const [items, setItems] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [pendingAction, setPendingAction] = useState(null) // status awaiting a reason
  const [reason, setReason] = useState('')
  const [deliveryUsers, setDeliveryUsers] = useState([])
  const [selectedDeliveryId, setSelectedDeliveryId] = useState(order.delivery_person_id || '')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const [{ items }, { history }, { users }] = await Promise.all([
        fetchOrderItems(order.id),
        fetchOrderHistory(order.id),
        fetchDeliveryUsers(),
      ])
      if (!cancelled) {
        setItems(items)
        setHistory(history)
        setDeliveryUsers(users)
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id])

  async function refreshOrder() {
    const { order: fresh } = await fetchOrder(order.id)
    if (fresh) setOrder(fresh)
  }

  async function handleTransition(newStatus) {
    if (REASON_REQUIRED.has(newStatus) && pendingAction !== newStatus) {
      setPendingAction(newStatus)
      setReason('')
      return
    }
    if (REASON_REQUIRED.has(newStatus) && !reason.trim()) {
      setError('Please enter a reason.')
      return
    }

    setBusy(true)
    setError('')
    const { order: updated, error, conflict } = await updateOrderStatus({
      orderId: order.id,
      expectedStatus: order.status,
      newStatus,
      reason: reason.trim(),
    })
    setBusy(false)

    if (conflict) {
      setError('This order was just updated by someone else — refreshed to the latest state. Please review and try again.')
      await refreshOrder()
      return
    }
    if (error) {
      setError(error.message || 'Could not update the order. Please try again.')
      return
    }

    setOrder(updated)
    setPendingAction(null)
    setReason('')
    const { history } = await fetchOrderHistory(order.id)
    setHistory(history)
    onChanged?.(updated)
  }

  async function handleAssignDelivery() {
    setBusy(true)
    setError('')
    const selected = deliveryUsers.find((u) => u.id === selectedDeliveryId)
    const { order: updated, error } = await assignDeliveryUser({
      orderId: order.id,
      deliveryUserId: selectedDeliveryId || null,
      deliveryName: selected?.name,
    })
    setBusy(false)
    if (error) {
      setError(error.message || 'Could not save the delivery assignment.')
      return
    }
    setOrder(updated)
    onChanged?.(updated)
  }

  const nextStatuses = ORDER_STATUS_TRANSITIONS[order.status] || []
  const color = ORDER_STATUS_COLOR[order.status] || ORDER_STATUS_COLOR.PENDING_CONFIRMATION
  const subtotal = Number(order.subtotal || 0)

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
          <div>
            <div className="font-heading font-semibold text-brick-700">#{order.order_number}</div>
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${color.bg} ${color.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
              {ORDER_STATUS_LABEL[order.status]}
            </span>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {error && (
            <div className="flex items-start gap-1.5 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {/* Customer */}
          <section className="space-y-1 text-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Customer</h3>
            <div className="font-medium text-gray-800">{order.customer_name}</div>
            <div className="text-gray-600">{order.customer_phone}</div>
            <div className="text-gray-600">{order.delivery_address}</div>
            {order.landmark && <div className="text-gray-500 text-xs">Landmark: {order.landmark}</div>}
            {order.order_notes && <div className="text-gray-500 text-xs">Notes: {order.order_notes}</div>}
            {order.delivery_latitude != null && order.delivery_longitude != null && (
              <a
                href={googleMapsLink(order.delivery_latitude, order.delivery_longitude)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brick-600 hover:text-brick-700 pt-0.5"
              >
                <MapPin size={12} /> View delivery location
              </a>
            )}
          </section>

          {/* Items */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Items {loading && '(loading…)'}
            </h3>
            {items.map((it) => (
              <div key={it.id} className="border rounded-lg p-2.5 text-sm">
                <div className="flex justify-between font-medium">
                  <span>
                    {it.item_name_snapshot}
                    {it.size_label ? ` (${it.size_label})` : ''} × {it.quantity}
                  </span>
                  <span>₹{it.item_total}</span>
                </div>
                {it.spice_level && <div className="text-xs text-gray-500 mt-0.5">Spice: {it.spice_level}</div>}
                {Array.isArray(it.addons) && it.addons.length > 0 && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    Add-ons: {it.addons.map((a) => a.name).join(', ')}
                  </div>
                )}
              </div>
            ))}

            <div className="text-sm space-y-1 pt-1 border-t">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              {Number(order.delivery_charge) > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span>₹{order.delivery_charge}</span>
                </div>
              )}
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-₹{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-gray-800">
                <span>Total</span>
                <span>₹{order.total}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 pt-1">
                <span>Payment</span>
                <span>
                  {order.payment_method} · {order.payment_status}
                </span>
              </div>
            </div>
          </section>

          {/* Delivery assignment — SUPER_ADMIN/ADMIN only (this modal is only
              reachable from the Orders tab, which KITCHEN/DELIVERY roles
              don't have nav access to — RLS is still the real backstop). */}
          {(order.status === ORDER_STATUS.PACKED || order.status === ORDER_STATUS.OUT_FOR_DELIVERY) && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1">
                <Truck size={12} /> Delivery person
              </h3>
              <div className="flex gap-2">
                <select
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brick-300 bg-white"
                  value={selectedDeliveryId}
                  onChange={(e) => setSelectedDeliveryId(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {deliveryUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <button
                  disabled={busy || selectedDeliveryId === (order.delivery_person_id || '')}
                  onClick={handleAssignDelivery}
                  className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-sm font-medium text-gray-700"
                >
                  Save
                </button>
              </div>
              {deliveryUsers.length === 0 && (
                <p className="text-xs text-gray-400">
                  No delivery users yet — ask a Super Admin to add one to the admins table with role DELIVERY.
                </p>
              )}
            </section>
          )}

          {/* Status actions */}
          {nextStatuses.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Update status</h3>

              {pendingAction && (
                <div className="space-y-2 bg-red-50 border border-red-100 rounded-lg p-3">
                  <label className="text-xs font-medium text-red-800">
                    Reason for {pendingAction === 'REJECTED' ? 'rejecting' : 'cancelling'} this order
                  </label>
                  <textarea
                    autoFocus
                    rows={2}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={busy || !reason.trim()}
                      onClick={() => handleTransition(pendingAction)}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-sm font-semibold py-2 rounded-lg"
                    >
                      {busy ? <Loader2 size={16} className="animate-spin mx-auto" /> : `Confirm ${ACTION_LABEL[pendingAction]}`}
                    </button>
                    <button
                      onClick={() => {
                        setPendingAction(null)
                        setReason('')
                      }}
                      className="px-4 text-sm text-gray-500"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}

              {!pendingAction && (
                <div className="grid grid-cols-2 gap-2">
                  {nextStatuses.map((status) => {
                    const destructive = status === 'REJECTED' || status === 'CANCELLED'
                    return (
                      <button
                        key={status}
                        disabled={busy}
                        onClick={() => handleTransition(status)}
                        className={`py-3 rounded-xl text-sm font-semibold transition-colors duration-150 disabled:opacity-50 ${
                          destructive
                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                            : 'bg-brick-600 text-white hover:bg-brick-700'
                        }`}
                      >
                        {busy ? <Loader2 size={16} className="animate-spin mx-auto" /> : ACTION_LABEL[status]}
                      </button>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {/* History */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1">
              <Clock size={12} /> Status history
            </h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-xs">
                <span className="text-gray-400 shrink-0 w-16">
                  {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-gray-600">Order placed — {ORDER_STATUS_LABEL.PENDING_CONFIRMATION}</span>
              </div>
              {history.map((h) => (
                <div key={h.id} className="flex items-start gap-2 text-xs">
                  <span className="text-gray-400 shrink-0 w-16">
                    {new Date(h.changed_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-gray-600">
                    {ORDER_STATUS_LABEL[h.new_status] || h.new_status}
                    {h.changed_by_email ? ` — ${h.changed_by_email}` : ''}
                    {h.note ? ` (${h.note})` : ''}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
