import { useState } from 'react'
import { Loader2, AlertCircle, Gauge, Save, Power } from 'lucide-react'
import { ADMIN_ROLE } from '../../data/orderConstants'
import { useCapacityData } from './useCapacityData'
import { updateKitchenSettings, updateItemCapacity } from './capacityActions'
import { capacityStatus } from './capacityStatus'
import Switch from '../Switch'

const STATUS_STYLE = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700',
  LIMITED: 'bg-amber-50 text-amber-700',
  SOLD_OUT: 'bg-gray-200 text-gray-600',
}

export default function CapacityDashboard({ role }) {
  const isSuperAdmin = role === ADMIN_ROLE.SUPER_ADMIN
  const { settings, dailyCounter, itemRows, loading, error, reload, serviceDate } = useCapacityData()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-400">
        <Loader2 size={24} className="animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
        <AlertCircle size={14} className="shrink-0" /> Couldn't load capacity data: {error}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Gauge size={20} className="text-brick-600" /> Capacity
        </h1>
        <span className="text-sm text-gray-400">{serviceDate}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SummaryCard label="Orders" used={dailyCounter.orders_count} max={settings?.max_orders_per_day} />
        <SummaryCard label="Portions" used={dailyCounter.portions_count} max={settings?.max_portions_per_day} />
      </div>

      {!settings?.ordering_enabled && (
        <div className="flex items-center gap-1.5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <Power size={14} className="shrink-0" /> Ordering is currently turned OFF for customers.
        </div>
      )}

      {isSuperAdmin ? (
        <SettingsForm settings={settings} onSaved={reload} />
      ) : (
        <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
          Only a Super Admin can change kitchen-wide capacity settings or item limits. You can still see today's usage below.
        </p>
      )}

      <ItemCapacityTable
        itemRows={isSuperAdmin ? itemRows : itemRows.filter((r) => r.max != null)}
        isSuperAdmin={isSuperAdmin}
        onSaved={reload}
      />
    </div>
  )
}

function SummaryCard({ label, used, max }) {
  return (
    <div className="bg-white border rounded-xl p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</div>
      <div className="text-2xl font-extrabold text-gray-800 mt-1">
        {used} <span className="text-sm font-medium text-gray-400">/ {max ?? '∞'}</span>
      </div>
    </div>
  )
}

function SettingsForm({ settings, onSaved }) {
  const [form, setForm] = useState({
    max_orders_per_day: settings?.max_orders_per_day ?? '',
    max_portions_per_day: settings?.max_portions_per_day ?? '',
    opening_time: settings?.opening_time?.slice(0, 5) ?? '',
    closing_time: settings?.closing_time?.slice(0, 5) ?? '',
    ordering_enabled: settings?.ordering_enabled ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setSaving(true)
    setError('')
    const { error } = await updateKitchenSettings({
      max_orders_per_day: form.max_orders_per_day === '' ? null : Number(form.max_orders_per_day),
      max_portions_per_day: form.max_portions_per_day === '' ? null : Number(form.max_portions_per_day),
      opening_time: form.opening_time || null,
      closing_time: form.closing_time || null,
      ordering_enabled: form.ordering_enabled,
    })
    setSaving(false)
    if (error) {
      setError(error.message || 'Could not save settings.')
      return
    }
    onSaved?.()
  }

  return (
    <div className="bg-white border rounded-xl p-4 space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Kitchen settings</h2>

      <Switch
        checked={form.ordering_enabled}
        onChange={(v) => setForm((f) => ({ ...f, ordering_enabled: v }))}
        label={form.ordering_enabled ? 'Accepting orders' : 'Orders closed'}
      />

      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-medium text-gray-500">
          Max orders/day
          <input
            type="number"
            min="0"
            placeholder="No limit"
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
            value={form.max_orders_per_day}
            onChange={(e) => setForm((f) => ({ ...f, max_orders_per_day: e.target.value }))}
          />
        </label>
        <label className="text-xs font-medium text-gray-500">
          Max portions/day
          <input
            type="number"
            min="0"
            placeholder="No limit"
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
            value={form.max_portions_per_day}
            onChange={(e) => setForm((f) => ({ ...f, max_portions_per_day: e.target.value }))}
          />
        </label>
        <label className="text-xs font-medium text-gray-500">
          Opening time
          <input
            type="time"
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
            value={form.opening_time}
            onChange={(e) => setForm((f) => ({ ...f, opening_time: e.target.value }))}
          />
        </label>
        <label className="text-xs font-medium text-gray-500">
          Closing time
          <input
            type="time"
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
            value={form.closing_time}
            onChange={(e) => setForm((f) => ({ ...f, closing_time: e.target.value }))}
          />
        </label>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-brick-600 hover:bg-brick-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-full transition-colors duration-150"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Save settings
      </button>
    </div>
  )
}

function ItemCapacityTable({ itemRows, isSuperAdmin, onSaved }) {
  if (itemRows.length === 0) {
    return (
      <div className="bg-white border rounded-xl p-4 text-sm text-gray-400 text-center">
        No item-level limits configured yet.
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-xl divide-y">
      <div className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Item capacity {isSuperAdmin && '— set a limit on any item below'}
      </div>
      {itemRows.map((row) => (
        <ItemRow key={row.id} row={row} isSuperAdmin={isSuperAdmin} onSaved={onSaved} />
      ))}
    </div>
  )
}

function ItemRow({ row, isSuperAdmin, onSaved }) {
  const [max, setMax] = useState(row.max ?? '')
  const [saving, setSaving] = useState(false)
  const hasLimit = row.max != null
  const status = hasLimit ? capacityStatus(row.sold, row.max) : null
  const remaining = hasLimit ? Math.max(0, row.max - row.sold) : null

  async function handleSave() {
    setSaving(true)
    await updateItemCapacity({ itemId: row.id, maxPortionsPerDay: max === '' ? null : Number(max) })
    setSaving(false)
    onSaved?.()
  }

  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-800 truncate">{row.name}</div>
        <div className="text-xs text-gray-400">
          {hasLimit ? `${row.sold} / ${row.max} sold · ${remaining} remaining` : 'No limit set'}
        </div>
      </div>
      {status && (
        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full shrink-0 ${STATUS_STYLE[status]}`}>
          {status.replace('_', ' ')}
        </span>
      )}
      {isSuperAdmin && (
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number"
            min="0"
            placeholder="No limit"
            className="w-20 border rounded-lg px-2 py-1 text-sm"
            value={max}
            onChange={(e) => setMax(e.target.value)}
          />
          <button
            disabled={saving || Number(max || 0) === Number(row.max || 0)}
            onClick={handleSave}
            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-600"
            aria-label={`Save limit for ${row.name}`}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          </button>
        </div>
      )}
    </div>
  )
}
