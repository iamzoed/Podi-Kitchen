// One accent color per category — keeps the brand shell (header, footer, cart)
// in the brick/gold palette while letting each category's content feel distinct.
// Class names are written out in full (not built with template strings) so
// Tailwind's content scanner can find them at build time.
export const categoryAccents = {
  idli: {
    dot: 'bg-amber-500',
    navActive: 'bg-amber-500 border-amber-500',
    grad: 'from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700',
    text: 'text-amber-600',
    border: 'border-amber-600',
    bgSoft: 'bg-amber-50',
  },
  dosa: {
    dot: 'bg-rose-500',
    navActive: 'bg-rose-500 border-rose-500',
    grad: 'from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700',
    text: 'text-rose-600',
    border: 'border-rose-600',
    bgSoft: 'bg-rose-50',
  },
  tiffins: {
    dot: 'bg-violet-500',
    navActive: 'bg-violet-500 border-violet-500',
    grad: 'from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700',
    text: 'text-violet-600',
    border: 'border-violet-600',
    bgSoft: 'bg-violet-50',
  },
  sides: {
    dot: 'bg-emerald-500',
    navActive: 'bg-emerald-500 border-emerald-500',
    grad: 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700',
    text: 'text-emerald-600',
    border: 'border-emerald-600',
    bgSoft: 'bg-emerald-50',
  },
  combo: {
    dot: 'bg-sky-500',
    navActive: 'bg-sky-500 border-sky-500',
    grad: 'from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700',
    text: 'text-sky-600',
    border: 'border-sky-600',
    bgSoft: 'bg-sky-50',
  },
  beverages: {
    dot: 'bg-orange-500',
    navActive: 'bg-orange-500 border-orange-500',
    grad: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
    text: 'text-orange-600',
    border: 'border-orange-600',
    bgSoft: 'bg-orange-50',
  },
}
