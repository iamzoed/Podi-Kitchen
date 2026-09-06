import { Truck, Wallet, BadgeIndianRupee } from 'lucide-react'
import { shopInfo } from '../data/menu'

export default function InfoBar() {
  return (
    <div className="bg-brick-50 border-b border-brick-100">
      <div className="max-w-3xl mx-auto px-4 py-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-brick-700">
        <span className="flex items-center gap-1.5">
          <Truck size={14} />
          {shopInfo.deliveryAreas}
        </span>
        {shopInfo.freeDelivery && (
          <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
            <BadgeIndianRupee size={14} />
            Free delivery, no hidden fees
          </span>
        )}
        {shopInfo.minOrder > 0 && (
          <span className="flex items-center gap-1.5">
            <Wallet size={14} />
            Min. order ₹{shopInfo.minOrder}
          </span>
        )}
      </div>
    </div>
  )
}
