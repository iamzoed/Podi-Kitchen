import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { menu as staticMenu } from '../data/menu'

// id -> bundled local image, derived from the static menu so DB rows without
// their own image_url still show the photo already shipped with the site.
const localImages = Object.fromEntries(staticMenu.map((item) => [item.id, item.image]))

function mapRow(row) {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    description: row.description,
    basePrice: Number(row.base_price),
    emoji: row.emoji,
    image: row.image_url || localImages[row.id] || null,
    popular: row.popular,
    veg: row.veg,
    variants: row.variants || [],
    addons: row.addons || [],
    allowSpiceLevel: row.allow_spice_level,
  }
}

// Live menu when Supabase is configured (so the admin panel's edits show up
// here), falling back to the static list in data/menu.js otherwise — the
// public site works either way.
//
// When configured, we deliberately start with an empty list rather than the
// static one: prices/availability can be edited live from the admin panel,
// so briefly showing the static data would risk flashing a stale price
// before the real one loads. Falls back to static data only if the fetch
// itself fails, so the site never goes blank.
export function useMenu() {
  const [items, setItems] = useState(isSupabaseConfigured ? [] : staticMenu)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false

    async function load() {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('available', true)
        .order('sort_order', { ascending: true })

      if (!cancelled) {
        if (!error && data && data.length > 0) {
          setItems(data.map(mapRow))
        } else {
          setItems(staticMenu)
        }
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { items, loading }
}
