import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { categories } from '../data/menu'
import { categoryAccents } from '../data/categoryAccents'
import { slugify } from '../utils/slugify'
import Switch from './Switch'

const BLANK = {
  id: '',
  category: categories[0].id,
  name: '',
  description: '',
  base_price: '',
  emoji: '',
  image_url: '',
  popular: false,
  veg: true,
  available: true,
  allow_spice_level: false,
  variants: [{ name: 'Regular', priceDelta: 0 }],
  addons: [],
}

export default function MenuItemForm({ item, onSave, onCancel, saving }) {
  const isNew = !item
  const [form, setForm] = useState(
    item
      ? {
          ...item,
          variants: item.variants?.length ? item.variants : [{ name: 'Regular', priceDelta: 0 }],
          addons: item.addons || [],
        }
      : BLANK
  )

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function updateRow(listKey, index, field, value) {
    setForm((f) => {
      const list = [...f[listKey]]
      list[index] = { ...list[index], [field]: value }
      return { ...f, [listKey]: list }
    })
  }

  function addRow(listKey, blank) {
    setForm((f) => ({ ...f, [listKey]: [...f[listKey], blank] }))
  }

  function removeRow(listKey, index) {
    setForm((f) => ({ ...f, [listKey]: f[listKey].filter((_, i) => i !== index) }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const id = isNew ? slugify(form.id || form.name) : form.id
    const cleanVariants = form.variants
      .filter((v) => v.name?.trim())
      .map((v) => ({ id: slugify(v.name), name: v.name.trim(), priceDelta: Number(v.priceDelta) || 0 }))
    const cleanAddons = form.addons
      .filter((a) => a.name?.trim())
      .map((a) => ({ id: slugify(a.name), name: a.name.trim(), price: Number(a.price) || 0 }))

    onSave({
      id,
      category: form.category,
      name: form.name,
      description: form.description,
      base_price: Number(form.base_price) || 0,
      emoji: form.emoji,
      image_url: form.image_url || null,
      popular: form.popular,
      veg: form.veg,
      available: form.available,
      allow_spice_level: form.allow_spice_level,
      variants: cleanVariants.length ? cleanVariants : [{ id: 'regular', name: 'Regular', priceDelta: 0 }],
      addons: cleanAddons,
    })
  }

  const accent = categoryAccents[form.category]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-heading font-semibold text-brick-700">{isNew ? 'Add item' : `Edit ${item.name}`}</h2>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basics */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Basics</h3>
            <label className="block text-xs font-medium text-gray-500">
              Name
              <input
                required
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brick-300"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </label>

            {isNew && (
              <label className="block text-xs font-medium text-gray-500">
                ID (leave blank to generate from name)
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brick-300"
                  placeholder={slugify(form.name || 'new-item')}
                  value={form.id}
                  onChange={(e) => set('id', e.target.value)}
                />
              </label>
            )}

            <label className="block text-xs font-medium text-gray-500">
              Description
              <textarea
                rows={2}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brick-300"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium text-gray-500">
                Category
                <select
                  className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${accent.text}`}
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-gray-500">
                Base price (₹)
                <input
                  type="number"
                  min="0"
                  required
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brick-300"
                  value={form.base_price}
                  onChange={(e) => set('base_price', e.target.value)}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium text-gray-500">
                Emoji (shown if no photo)
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brick-300"
                  value={form.emoji}
                  onChange={(e) => set('emoji', e.target.value)}
                />
              </label>
              <label className="block text-xs font-medium text-gray-500">
                Photo URL (optional)
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brick-300"
                  placeholder="https://…"
                  value={form.image_url || ''}
                  onChange={(e) => set('image_url', e.target.value)}
                />
              </label>
            </div>
          </section>

          {/* Sizes */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Sizes / variants</h3>
            {form.variants.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  placeholder="Label, e.g. 6 pcs"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brick-300"
                  value={v.name}
                  onChange={(e) => updateRow('variants', i, 'name', e.target.value)}
                />
                <div className="relative w-28 shrink-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+₹</span>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full border rounded-lg pl-7 pr-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brick-300"
                    value={v.priceDelta}
                    onChange={(e) => updateRow('variants', i, 'priceDelta', e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeRow('variants', i)}
                  disabled={form.variants.length === 1}
                  className="text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-gray-400 shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addRow('variants', { name: '', priceDelta: 0 })}
              className="flex items-center gap-1 text-xs font-medium text-brick-600 hover:text-brick-700"
            >
              <Plus size={14} /> Add size
            </button>
          </section>

          {/* Add-ons */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Add-ons</h3>
            {form.addons.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  placeholder="Label, e.g. Extra ghee"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brick-300"
                  value={a.name}
                  onChange={(e) => updateRow('addons', i, 'name', e.target.value)}
                />
                <div className="relative w-28 shrink-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full border rounded-lg pl-6 pr-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brick-300"
                    value={a.price}
                    onChange={(e) => updateRow('addons', i, 'price', e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeRow('addons', i)}
                  className="text-gray-400 hover:text-red-600 shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addRow('addons', { name: '', price: 0 })}
              className="flex items-center gap-1 text-xs font-medium text-brick-600 hover:text-brick-700"
            >
              <Plus size={14} /> Add add-on
            </button>
          </section>

          {/* Options */}
          <section className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Options</h3>
            <Switch checked={form.popular} onChange={(v) => set('popular', v)} label="Show a Popular badge" />
            <Switch checked={form.veg} onChange={(v) => set('veg', v)} label="Vegetarian" />
            <Switch
              checked={form.allow_spice_level}
              onChange={(v) => set('allow_spice_level', v)}
              label="Let customers pick a spice level"
            />
            <Switch checked={form.available} onChange={(v) => set('available', v)} label="Available on the site" />
          </section>
        </div>

        <div className="sticky bottom-0 bg-white border-t p-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-brick-600 hover:bg-brick-700 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-full transition-colors duration-150"
          >
            {saving ? 'Saving…' : isNew ? 'Add item' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
