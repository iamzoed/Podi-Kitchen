import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, CircleDot, IceCreamCone, LayoutGrid, UtensilsCrossed, Soup, Coffee } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { categories } from '../data/menu'
import { categoryAccents } from '../data/categoryAccents'
import MenuItemForm from './MenuItemForm'
import Switch from './Switch'

const ICONS = { CircleDot, IceCreamCone, LayoutGrid, UtensilsCrossed, Soup, Coffee }

export default function AdminDashboard() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null = closed, {} = new, item = edit
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('menu_items').select('*').order('sort_order', { ascending: true })
    if (!error) setItems(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSave(row) {
    setSaving(true)
    setError('')
    const isNew = !items.some((i) => i.id === row.id)
    const { error } = isNew
      ? await supabase.from('menu_items').insert({ ...row, sort_order: items.length + 1 })
      : await supabase.from('menu_items').update(row).eq('id', row.id)
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setEditing(null)
    load()
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    const { error } = await supabase.from('menu_items').delete().eq('id', id)
    if (error) {
      setError(error.message)
      return
    }
    load()
  }

  async function toggleAvailable(item, value) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, available: value } : i)))
    await supabase.from('menu_items').update({ available: value }).eq('id', item.id)
  }

  const availableCount = items.filter((i) => i.available).length

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
          <h1 className="font-heading text-xl font-semibold text-gray-800">Menu items</h1>
          <button
            onClick={() => setEditing({})}
            className="flex items-center gap-1.5 bg-brick-600 hover:bg-brick-700 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors duration-150"
          >
            <Plus size={16} /> Add item
          </button>
        </div>
        {!loading && (
          <p className="text-sm text-gray-400 mb-5">
            {items.length} items · {availableCount} visible on the site
          </p>
        )}

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>}

        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          categories.map((cat) => {
            const catItems = items.filter((i) => i.category === cat.id)
            if (catItems.length === 0) return null
            const accent = categoryAccents[cat.id]
            const Icon = ICONS[cat.icon]
            return (
              <div key={cat.id} className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center ${accent.bgSoft} ${accent.text}`}>
                    {Icon && <Icon size={14} />}
                  </span>
                  <h2 className="text-sm font-semibold text-gray-700">{cat.name}</h2>
                  <span className="text-xs text-gray-400">({catItems.length})</span>
                </div>

                <div className="bg-white rounded-xl border divide-y">
                  {catItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center text-xl">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          item.emoji
                        )}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-800 truncate">{item.name}</span>
                          {item.popular && (
                            <span className="text-[10px] font-semibold uppercase bg-gold-500/10 text-gold-500 px-1.5 py-0.5 rounded-full">
                              Popular
                            </span>
                          )}
                          {!item.available && (
                            <span className="text-[10px] font-semibold uppercase bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                              Hidden
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">₹{item.base_price}</div>
                      </div>

                      <Switch checked={item.available} onChange={(v) => toggleAvailable(item, v)} />

                      <div className="flex items-center gap-1 pl-2 border-l">
                        <button
                          onClick={() => setEditing(item)}
                          aria-label={`Edit ${item.name}`}
                          className="p-2 text-gray-400 hover:text-brick-600 hover:bg-brick-50 rounded-lg transition-colors duration-150"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          aria-label={`Delete ${item.name}`}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      {editing !== null && (
        <MenuItemForm
          item={editing.id ? editing : null}
          saving={saving}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
