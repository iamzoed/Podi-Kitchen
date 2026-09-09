// One disciplined brand accent (brick green) used everywhere — this used
// to be six different hues (one per category: amber/rose/violet/emerald/
// sky/orange), which read as visually noisy/generic rather than premium.
// A single consistent color for every "selected/active" state, with gold
// reserved specifically for badges and the primary CTA gradient, reads as
// a considered brand instead of a template. Kept the same object shape so
// every existing callsite (CategoryNav, CategoryShowcase, MenuItemCard)
// works unchanged — only the values moved.
const brand = {
  dot: 'bg-brick-600',
  navActive: 'bg-brick-600 border-brick-600',
  grad: 'from-brick-600 to-brick-700 hover:from-brick-700 hover:to-brick-800',
  text: 'text-brick-700',
  border: 'border-brick-600',
  bgSoft: 'bg-brick-50',
}

export const categoryAccents = {
  idli: brand,
  dosa: brand,
  tiffins: brand,
  sides: brand,
  combo: brand,
  beverages: brand,
}
