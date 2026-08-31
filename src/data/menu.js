// Single source of truth for shop info + menu.
// Edit this file to change prices, items, or customization options —
// the ordering UI is entirely driven by this data.

export const shopInfo = {
  name: 'Podi Kitchen',
  tagline: 'Homemade Podi Idli & Dosa, made fresh to order',
  whatsappNumber: '911234567890', // country code + number, no + or spaces
  city: 'Your City',
  hours: '8:00 AM – 8:00 PM, Tue–Sun',
}

export const categories = [
  { id: 'idli', name: 'Idli' },
  { id: 'dosa', name: 'Dosa' },
  { id: 'combo', name: 'Combos' },
  { id: 'extras', name: 'Extras' },
]

export const spiceLevels = ['Mild', 'Medium', 'Spicy']

export const menu = [
  {
    id: 'podi-idli',
    category: 'idli',
    name: 'Podi Idli',
    description: 'Soft steamed idli tossed in signature spiced podi and ghee.',
    basePrice: 80,
    variants: [
      { id: 'qty-4', name: '4 pcs', priceDelta: 0 },
      { id: 'qty-6', name: '6 pcs', priceDelta: 30 },
      { id: 'qty-8', name: '8 pcs', priceDelta: 60 },
    ],
    addons: [
      { id: 'extra-ghee', name: 'Extra ghee', price: 10 },
      { id: 'extra-podi', name: 'Extra podi (pack)', price: 15 },
      { id: 'extra-chutney', name: 'Extra chutney', price: 15 },
    ],
    allowSpiceLevel: true,
  },
  {
    id: 'plain-idli',
    category: 'idli',
    name: 'Plain Idli',
    description: 'Classic soft idli served with chutney and sambar.',
    basePrice: 60,
    variants: [
      { id: 'qty-4', name: '4 pcs', priceDelta: 0 },
      { id: 'qty-6', name: '6 pcs', priceDelta: 25 },
    ],
    addons: [
      { id: 'extra-sambar', name: 'Extra sambar', price: 15 },
      { id: 'extra-chutney', name: 'Extra chutney', price: 15 },
    ],
    allowSpiceLevel: false,
  },
  {
    id: 'podi-dosa',
    category: 'dosa',
    name: 'Podi Dosa',
    description: 'Crisp dosa layered with podi and ghee, folded fresh.',
    basePrice: 90,
    variants: [
      { id: 'single', name: 'Single', priceDelta: 0 },
      { id: 'double', name: 'Double layer', priceDelta: 35 },
    ],
    addons: [
      { id: 'extra-ghee', name: 'Extra ghee', price: 10 },
      { id: 'extra-podi', name: 'Extra podi (pack)', price: 15 },
      { id: 'cheese', name: 'Cheese filling', price: 30 },
    ],
    allowSpiceLevel: true,
  },
  {
    id: 'masala-dosa',
    category: 'dosa',
    name: 'Masala Dosa',
    description: 'Crisp dosa with spiced potato masala filling.',
    basePrice: 100,
    variants: [
      { id: 'single', name: 'Single', priceDelta: 0 },
      { id: 'double', name: 'Double layer', priceDelta: 35 },
    ],
    addons: [
      { id: 'extra-podi', name: 'Extra podi (pack)', price: 15 },
      { id: 'cheese', name: 'Cheese filling', price: 30 },
    ],
    allowSpiceLevel: true,
  },
  {
    id: 'idli-dosa-combo',
    category: 'combo',
    name: 'Idli–Dosa Combo',
    description: '2 podi idli + 1 podi dosa, with podi and chutney on the side.',
    basePrice: 150,
    variants: [{ id: 'regular', name: 'Regular', priceDelta: 0 }],
    addons: [
      { id: 'extra-podi', name: 'Extra podi (pack)', price: 15 },
      { id: 'extra-chutney', name: 'Extra chutney', price: 15 },
    ],
    allowSpiceLevel: true,
  },
  {
    id: 'podi-jar',
    category: 'extras',
    name: 'Podi Jar (200g)',
    description: 'Take our signature podi home — great with rice, dosa, or as a snack mix.',
    basePrice: 120,
    variants: [
      { id: 'regular', name: 'Regular spice', priceDelta: 0 },
      { id: 'extra-spicy', name: 'Extra spicy', priceDelta: 0 },
    ],
    addons: [],
    allowSpiceLevel: false,
  },
]
