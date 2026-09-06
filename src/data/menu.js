// Single source of truth for shop info + menu.
// Edit this file to change prices, items, or customization options —
// the ordering UI is entirely driven by this data.

import podiIdliImg from '../assets/podi-idli.jpg'
import plainIdliImg from '../assets/plain-idli.jpg'
import ravaIdliImg from '../assets/rava-idli.jpg'
import podiDosaImg from '../assets/podi-dosa.jpg'
import masalaDosaImg from '../assets/masala-dosa.jpg'
import uttapamImg from '../assets/uttapam.jpg'
import meduVadaImg from '../assets/medu-vada.jpg'
import sambarVadaImg from '../assets/sambar-vada.jpg'
import coconutChutneyImg from '../assets/coconut-chutney.jpg'
import sambarImg from '../assets/sambar.jpg'
import rasamImg from '../assets/rasam.jpg'
import curdRiceImg from '../assets/curd-rice.jpg'
import lemonRiceImg from '../assets/lemon-rice.jpg'
import filterCoffeeImg from '../assets/filter-coffee.jpg'
import buttermilkImg from '../assets/buttermilk.jpg'
import comboImg from '../assets/combo.jpg'
import podiJarImg from '../assets/podi-jar.jpg'
import upmaImg from '../assets/upma.jpg'
import appamImg from '../assets/appam.jpg'

export const shopInfo = {
  name: 'Podi Kitchen',
  tagline: 'Homemade Podi Idli & Dosa, made fresh to order',
  whatsappNumber: '911234567890', // country code + number, no + or spaces
  city: 'Mumbai',
  hours: '8:00 AM – 8:00 PM, Tue–Sun',
  about:
    'Podi Kitchen is a Mumbai home kitchen making South Indian breakfast the traditional way — fresh batter, hand-ground podi, homemade ghee, and completely homemade with zero preservatives. No shortcuts, no hidden costs. Edit this line in src/data/menu.js to tell your own story.',
  deliveryAreas: 'Delivering across Mumbai', // e.g. "Delivering to Matunga, Sion, Dadar"
  freeDelivery: true, // set to false to hide the "Free Delivery" messaging
  minOrder: 150, // ₹, set to 0 to disable the "min order" note
  facebookUrl: '', // paste your Facebook page URL here, e.g. 'https://facebook.com/podikitchen'
  instagramUrl: '', // paste your Instagram profile URL here, e.g. 'https://instagram.com/podikitchen'
}

// icon: lucide-react component name, rendered by CategoryNav
// Kept to 6 categories on purpose — enough to group items naturally without
// overwhelming the nav. Merge new items into these rather than adding new
// categories unless a category would otherwise have 4+ items.
export const categories = [
  { id: 'idli', name: 'Idli', icon: 'CircleDot' },
  { id: 'dosa', name: 'Dosa', icon: 'IceCreamCone' },
  { id: 'tiffins', name: 'Tiffins', icon: 'UtensilsCrossed' },
  { id: 'sides', name: 'Sides & Rice', icon: 'Soup' },
  { id: 'combo', name: 'Combos', icon: 'LayoutGrid' },
  { id: 'beverages', name: 'Beverages & More', icon: 'Coffee' },
]

export const spiceLevels = ['Mild', 'Medium', 'Spicy']

export const menu = [
  {
    id: 'podi-idli',
    category: 'idli',
    name: 'Podi Idli',
    description: 'Soft steamed idli tossed in signature spiced podi and ghee.',
    basePrice: 80,
    emoji: '🍚',
    image: podiIdliImg,
    popular: true,
    veg: true,
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
    emoji: '⚪',
    image: plainIdliImg,
    popular: false,
    veg: true,
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
    id: 'rava-idli',
    category: 'idli',
    name: 'Rava Idli',
    description: 'Semolina idli studded with mustard, curry leaves, and cashew.',
    basePrice: 70,
    emoji: '🍥',
    image: ravaIdliImg,
    popular: false,
    veg: true,
    variants: [
      { id: 'qty-4', name: '4 pcs', priceDelta: 0 },
      { id: 'qty-6', name: '6 pcs', priceDelta: 30 },
    ],
    addons: [
      { id: 'extra-ghee', name: 'Extra ghee', price: 10 },
      { id: 'extra-chutney', name: 'Extra chutney', price: 15 },
    ],
    allowSpiceLevel: true,
  },
  {
    id: 'podi-dosa',
    category: 'dosa',
    name: 'Podi Dosa',
    description: 'Crisp dosa layered with podi and ghee, folded fresh.',
    basePrice: 90,
    emoji: '🌯',
    image: podiDosaImg,
    popular: true,
    veg: true,
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
    emoji: '🌮',
    image: masalaDosaImg,
    popular: false,
    veg: true,
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
    id: 'uttapam',
    category: 'dosa',
    name: 'Onion Uttapam',
    description: 'Thick savory pancake topped with onion, tomato, and coriander.',
    basePrice: 90,
    emoji: '🥞',
    image: uttapamImg,
    popular: false,
    veg: true,
    variants: [
      { id: 'onion', name: 'Onion', priceDelta: 0 },
      { id: 'mixed-veg', name: 'Mixed veg', priceDelta: 15 },
    ],
    addons: [
      { id: 'extra-podi', name: 'Extra podi (pack)', price: 15 },
      { id: 'cheese', name: 'Cheese topping', price: 30 },
    ],
    allowSpiceLevel: true,
  },
  {
    id: 'medu-vada',
    category: 'tiffins',
    name: 'Medu Vada',
    description: 'Crisp, fluffy lentil doughnuts served with sambar and coconut chutney.',
    basePrice: 50,
    emoji: '🍩',
    image: meduVadaImg,
    popular: true,
    veg: true,
    variants: [
      { id: 'qty-2', name: '2 pcs', priceDelta: 0 },
      { id: 'qty-4', name: '4 pcs', priceDelta: 40 },
    ],
    addons: [
      { id: 'extra-sambar', name: 'Extra sambar', price: 15 },
      { id: 'extra-chutney', name: 'Extra chutney', price: 15 },
    ],
    allowSpiceLevel: false,
  },
  {
    id: 'sambar-vada',
    category: 'tiffins',
    name: 'Sambar Vada',
    description: 'Medu vada soaked in hot sambar, topped with coriander.',
    basePrice: 70,
    emoji: '🍩',
    image: sambarVadaImg,
    popular: false,
    veg: true,
    variants: [
      { id: 'qty-2', name: '2 pcs', priceDelta: 0 },
      { id: 'qty-4', name: '4 pcs', priceDelta: 50 },
    ],
    addons: [{ id: 'extra-chutney', name: 'Extra chutney', price: 15 }],
    allowSpiceLevel: true,
  },
  {
    id: 'upma',
    category: 'tiffins',
    name: 'Rava Upma',
    description: 'Semolina upma tempered with mustard, curry leaves, and cashew, served with chutney.',
    basePrice: 50,
    emoji: '🥣',
    image: upmaImg,
    popular: false,
    veg: true,
    variants: [
      { id: 'regular', name: 'Regular', priceDelta: 0 },
      { id: 'large', name: 'Large', priceDelta: 25 },
    ],
    addons: [
      { id: 'extra-ghee', name: 'Extra ghee', price: 10 },
      { id: 'extra-chutney', name: 'Extra chutney', price: 15 },
    ],
    allowSpiceLevel: true,
  },
  {
    id: 'appam',
    category: 'tiffins',
    name: 'Appam',
    description: 'Soft, lacy rice-and-coconut pancakes, best with vegetable stew.',
    basePrice: 60,
    emoji: '🥞',
    image: appamImg,
    popular: false,
    veg: true,
    variants: [
      { id: 'qty-2', name: '2 pcs', priceDelta: 0 },
      { id: 'qty-4', name: '4 pcs', priceDelta: 45 },
    ],
    addons: [{ id: 'extra-stew', name: 'Extra vegetable stew', price: 25 }],
    allowSpiceLevel: true,
  },
  {
    id: 'coconut-chutney',
    category: 'sides',
    name: 'Coconut Chutney',
    description: 'Fresh ground coconut chutney tempered with mustard and curry leaves.',
    basePrice: 30,
    emoji: '🥥',
    image: coconutChutneyImg,
    popular: false,
    veg: true,
    variants: [
      { id: 'small', name: 'Small cup', priceDelta: 0 },
      { id: 'large', name: 'Large cup', priceDelta: 20 },
    ],
    addons: [],
    allowSpiceLevel: false,
  },
  {
    id: 'sambar',
    category: 'sides',
    name: 'Sambar',
    description: 'Toor dal and vegetable stew, slow-cooked with tamarind and spices.',
    basePrice: 40,
    emoji: '🍲',
    image: sambarImg,
    popular: true,
    veg: true,
    variants: [
      { id: 'small', name: 'Small bowl', priceDelta: 0 },
      { id: 'large', name: 'Large bowl', priceDelta: 25 },
    ],
    addons: [],
    allowSpiceLevel: true,
  },
  {
    id: 'rasam',
    category: 'sides',
    name: 'Rasam',
    description: 'Tangy tomato and tamarind rasam, tempered with pepper and cumin.',
    basePrice: 40,
    emoji: '🍅',
    image: rasamImg,
    popular: false,
    veg: true,
    variants: [
      { id: 'small', name: 'Small bowl', priceDelta: 0 },
      { id: 'large', name: 'Large bowl', priceDelta: 25 },
    ],
    addons: [],
    allowSpiceLevel: true,
  },
  {
    id: 'curd-rice',
    category: 'sides',
    name: 'Curd Rice',
    description: 'Cooling curd rice tempered with mustard, curry leaves, and pomegranate.',
    basePrice: 70,
    emoji: '🍚',
    image: curdRiceImg,
    popular: true,
    veg: true,
    variants: [
      { id: 'regular', name: 'Regular', priceDelta: 0 },
      { id: 'large', name: 'Large', priceDelta: 30 },
    ],
    addons: [{ id: 'extra-pickle', name: 'Extra pickle', price: 10 }],
    allowSpiceLevel: false,
  },
  {
    id: 'lemon-rice',
    category: 'sides',
    name: 'Lemon Rice',
    description: 'Tangy tempered rice with peanuts, curry leaves, and turmeric.',
    basePrice: 70,
    emoji: '🍋',
    image: lemonRiceImg,
    popular: false,
    veg: true,
    variants: [
      { id: 'regular', name: 'Regular', priceDelta: 0 },
      { id: 'large', name: 'Large', priceDelta: 30 },
    ],
    addons: [{ id: 'extra-peanuts', name: 'Extra peanuts', price: 10 }],
    allowSpiceLevel: true,
  },
  {
    id: 'filter-coffee',
    category: 'beverages',
    name: 'Filter Coffee',
    description: 'Strong, frothy South Indian filter coffee served in a traditional tumbler.',
    basePrice: 30,
    emoji: '☕',
    image: filterCoffeeImg,
    popular: true,
    veg: true,
    variants: [
      { id: 'single', name: 'Single', priceDelta: 0 },
      { id: 'strong', name: 'Extra strong', priceDelta: 10 },
    ],
    addons: [],
    allowSpiceLevel: false,
  },
  {
    id: 'buttermilk',
    category: 'beverages',
    name: 'Spiced Buttermilk',
    description: 'Chilled buttermilk with curry leaves, ginger, and a hint of spice.',
    basePrice: 25,
    emoji: '🥛',
    image: buttermilkImg,
    popular: false,
    veg: true,
    variants: [{ id: 'regular', name: 'Regular', priceDelta: 0 }],
    addons: [],
    allowSpiceLevel: false,
  },
  {
    id: 'idli-dosa-combo',
    category: 'combo',
    name: 'Idli–Dosa Combo',
    description: '2 podi idli + 1 podi dosa, with podi and chutney on the side.',
    basePrice: 150,
    emoji: '🍽️',
    image: comboImg,
    popular: true,
    veg: true,
    variants: [{ id: 'regular', name: 'Regular', priceDelta: 0 }],
    addons: [
      { id: 'extra-podi', name: 'Extra podi (pack)', price: 15 },
      { id: 'extra-chutney', name: 'Extra chutney', price: 15 },
    ],
    allowSpiceLevel: true,
  },
  {
    id: 'podi-jar',
    category: 'beverages',
    name: 'Podi Jar (200g)',
    description: 'Take our signature podi home — great with rice, dosa, or as a snack mix.',
    basePrice: 120,
    emoji: '🫙',
    image: podiJarImg,
    popular: false,
    veg: true,
    variants: [
      { id: 'regular', name: 'Regular spice', priceDelta: 0 },
      { id: 'extra-spicy', name: 'Extra spicy', priceDelta: 0 },
    ],
    addons: [],
    allowSpiceLevel: false,
  },
]
