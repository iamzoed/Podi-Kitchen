import { useState } from 'react'
import { ChefHat, LogOut, ClipboardList, UtensilsCrossed, Soup, Truck, Gauge } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { shopInfo } from '../data/menu'
import { ROLE_TABS } from '../data/orderConstants'
import AdminDashboard from './AdminDashboard'
import AccessDenied from './AccessDenied'
import OrderDashboard from './orders/OrderDashboard'
import KitchenDashboard from './kitchen/KitchenDashboard'
import DeliveryDashboard from './delivery/DeliveryDashboard'
import CapacityDashboard from './capacity/CapacityDashboard'

const TAB_META = {
  orders: { label: 'Orders', icon: ClipboardList, path: '/admin/orders', Screen: OrderDashboard },
  kitchen: { label: 'Kitchen', icon: Soup, path: '/admin/kitchen', Screen: KitchenDashboard },
  delivery: { label: 'Delivery', icon: Truck, path: '/admin/delivery', Screen: DeliveryDashboard },
  capacity: { label: 'Capacity', icon: Gauge, path: '/admin/capacity', Screen: CapacityDashboard },
  menu: { label: 'Menu', icon: UtensilsCrossed, path: '/admin/menu', Screen: AdminDashboard },
}
const TAB_NAMES = Object.keys(TAB_META)

function tabFromPath(pathname) {
  const seg = pathname.replace(/^\/admin\/?/, '')
  return TAB_NAMES.includes(seg) ? seg : null
}

// Role-aware nav: RLS is the actual security boundary (every screen here
// queries tables that already scope themselves per role), this only decides
// what's shown and gives a clear denial instead of a confusing blank screen
// for a direct URL a role isn't meant to reach.
export default function AdminShell({ role }) {
  const allowedTabs = (ROLE_TABS[role] || []).filter((t) => TAB_NAMES.includes(t))
  const requestedTab = tabFromPath(window.location.pathname)
  const deniedDirectAccess = requestedTab !== null && !allowedTabs.includes(requestedTab)
  const [tab, setTab] = useState(deniedDirectAccess ? null : requestedTab || allowedTabs[0] || null)

  function selectTab(t) {
    setTab(t)
    window.history.pushState(null, '', TAB_META[t].path)
  }

  const ActiveScreen = tab ? TAB_META[tab].Screen : null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-br from-brick-600 to-brick-700 text-white">
        <div className="max-w-4xl mx-auto px-4 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat size={20} />
            <span className="font-heading font-semibold">{shopInfo.name} Admin</span>
            {role && (
              <span className="text-[10px] font-semibold uppercase bg-white/15 px-1.5 py-0.5 rounded-full">
                {role.replace('_', ' ')}
              </span>
            )}
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>

        {allowedTabs.length > 1 && (
          <div className="max-w-4xl mx-auto px-4 flex gap-1 pt-3 pb-2">
            {allowedTabs.map((t) => (
              <TabButton
                key={t}
                active={tab === t}
                onClick={() => selectTab(t)}
                icon={TAB_META[t].icon}
                label={TAB_META[t].label}
              />
            ))}
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {deniedDirectAccess || !ActiveScreen ? <AccessDenied /> : <ActiveScreen role={role} />}
      </main>
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150 ${
        active ? 'bg-white text-brick-700' : 'text-white/80 hover:bg-white/10'
      }`}
    >
      <Icon size={14} /> {label}
    </button>
  )
}
