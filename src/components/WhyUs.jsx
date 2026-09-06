import { ChefHat, Leaf, ShieldCheck, Clock3, BadgeIndianRupee, Truck } from 'lucide-react'
import { shopInfo } from '../data/menu'

const POINTS = [
  {
    icon: ChefHat,
    title: 'Home-Cooked',
    text: 'Made fresh in a real home kitchen — even our ghee is homemade.',
    bg: 'bg-amber-50',
    color: 'text-amber-600',
  },
  {
    icon: Leaf,
    title: '100% Homemade',
    text: 'Fresh, quality ingredients, zero preservatives, pure vegetarian.',
    bg: 'bg-emerald-50',
    color: 'text-emerald-600',
  },
  {
    icon: ShieldCheck,
    title: 'Hygienic Kitchen',
    text: 'Clean ingredients, clean process, every single day.',
    bg: 'bg-sky-50',
    color: 'text-sky-600',
  },
  {
    icon: Clock3,
    title: 'Made to Order',
    text: 'Nothing sits around — we cook once you order.',
    bg: 'bg-rose-50',
    color: 'text-rose-600',
  },
  {
    icon: BadgeIndianRupee,
    title: 'No Hidden Costs',
    text: 'No platform fees, no surge pricing — just the menu price.',
    bg: 'bg-violet-50',
    color: 'text-violet-600',
  },
  {
    icon: Truck,
    title: 'Free Delivery',
    text: `Completely free delivery across ${shopInfo.city}.`,
    bg: 'bg-orange-50',
    color: 'text-orange-600',
  },
]

export default function WhyUs() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="font-heading text-lg font-semibold text-brick-800 mb-4">Why Podi Kitchen</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
        {POINTS.map((p) => (
          <div key={p.title} className="flex flex-col items-center text-center gap-2">
            <span className={`w-12 h-12 rounded-full flex items-center justify-center ${p.bg} ${p.color}`}>
              <p.icon size={22} />
            </span>
            <div className="text-sm font-semibold text-gray-800">{p.title}</div>
            <div className="text-xs text-gray-500 leading-snug">{p.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
