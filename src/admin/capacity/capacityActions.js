import { supabase } from '../../lib/supabaseClient'

// RLS restricts this update to SUPER_ADMIN (kitchen_settings' update
// policy) — an ADMIN calling this gets a permission error back, which the
// UI never lets them trigger in the first place (the form is hidden for
// them), but the database is what actually stops it either way.
export async function updateKitchenSettings(patch) {
  const { data, error } = await supabase.from('kitchen_settings').update(patch).eq('id', 1).select().maybeSingle()
  if (error) return { error }
  return { settings: data }
}

// Also SUPER_ADMIN-only, enforced by a trigger (menu_items writes are
// otherwise open to any operational admin) since RLS alone can't restrict
// one column more tightly than the rest of a row.
export async function updateItemCapacity({ itemId, maxPortionsPerDay }) {
  const { data, error } = await supabase
    .from('menu_items')
    .update({ max_portions_per_day: maxPortionsPerDay })
    .eq('id', itemId)
    .select()
    .maybeSingle()
  if (error) return { error }
  return { item: data }
}
