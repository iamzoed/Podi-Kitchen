import { useEffect, useRef, useState } from 'react'
import { ShoppingBag, Menu, Sparkles, User, AlertTriangle, LogOut, ChevronRight } from 'lucide-react'
import { categories, shopInfo } from './data/menu'
import heroImg from './assets/combo.jpg'
import CategoryNav from './components/CategoryNav'
import CategoryShowcase from './components/CategoryShowcase'
import MumbaiSkyline from './components/MumbaiSkyline'
import SideMenu from './components/SideMenu'
import SearchAndFilters from './components/SearchAndFilters'
import InfoBar from './components/InfoBar'
import MenuItemCard from './components/MenuItemCard'
import CartDrawer from './components/CartDrawer'
import Footer from './components/Footer'
import WhyUs from './components/WhyUs'
import CustomerAuthModal from './components/CustomerAuthModal'
import MyOrdersModal from './components/MyOrdersModal'
import { cartTotal } from './utils/order'
import { flyToCart } from './utils/flyToCart'
import { useMenu } from './hooks/useMenu'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import { useOrderingStatus } from './hooks/useOrderingStatus'
import { supabase, isSupabaseConfigured } from './lib/supabaseClient'

const CLOSED_MESSAGE = {
  closed: 'Orders are closed for tonight — check back soon.',
  outside_hours: 'We\'re outside our ordering hours right now.',
  full: 'We\'re at full kitchen capacity for tonight. Please try again later.',
}

function App() {
  const { items: menu, loading: menuLoading } = useMenu()
  const { user } = useAuth()
  const { profile, saveProfile } = useProfile(user?.id)
  const { orderingOpen, closedReason, itemStatus } = useOrderingStatus()
  const [activeCategory, setActiveCategory] = useState(categories[0].id)
  const [cartLines, setCartLines] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [myOrdersOpen, setMyOrdersOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [vegOnly, setVegOnly] = useState(false)
  const [popularOnly, setPopularOnly] = useState(false)
  const cartBtnRef = useRef(null)

  const trimmedQuery = searchQuery.trim().toLowerCase()
  const isSearching = trimmedQuery.length > 0

  // Searching looks across the whole menu, not just the active category —
  // a customer typing "vada" shouldn't have to guess which tab it's under.
  const itemsInCategory = (isSearching ? menu : menu.filter((m) => m.category === activeCategory)).filter((m) => {
    if (vegOnly && !m.veg) return false
    if (popularOnly && !m.popular) return false
    if (isSearching) {
      return m.name.toLowerCase().includes(trimmedQuery) || (m.description || '').toLowerCase().includes(trimmedQuery)
    }
    return true
  })
  const total = cartTotal(cartLines)
  const itemCount = cartLines.reduce((sum, l) => sum + l.qty, 0)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 200)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function addToCart(line, sourceEl) {
    setCartLines((prev) => [...prev, line])
    setTimeout(() => flyToCart(sourceEl, cartBtnRef.current), 0)
  }

  function removeFromCart(index) {
    setCartLines((prev) => prev.filter((_, i) => i !== index))
  }

  function handleOrderPlaced() {
    setCartLines([])
    setCartOpen(false)
  }

  function handleReorder(lines, someUnavailable) {
    setCartLines((prev) => [...prev, ...lines])
    setMyOrdersOpen(false)
    setCartOpen(true)
    setToast(
      someUnavailable
        ? 'Added what\'s still available to your cart — a couple of items from that order are no longer on the menu.'
        : 'Added to your cart!'
    )
    setTimeout(() => setToast(''), 4000)
  }

  return (
    <div className="min-h-screen bg-cream font-sans">
      <div
        className={`fixed top-0 inset-x-0 z-40 bg-brick-700/95 backdrop-blur text-white shadow-md transition-transform duration-300 ${
          scrolled ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="w-9 h-9 -ml-1.5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors duration-150"
          >
            <Menu size={20} />
          </button>
          <span className="font-heading font-semibold text-sm tracking-wide truncate">{shopInfo.name}</span>
          <div className="flex items-center gap-3">
            {isSupabaseConfigured && !user && (
              <button
                onClick={() => setAuthOpen(true)}
                aria-label="Sign in"
                className="w-8 h-8 rounded-full bg-gold-500 hover:bg-gold-400 text-white flex items-center justify-center shadow-sm transition-colors duration-150"
              >
                <User size={16} />
              </button>
            )}
            <button onClick={() => setCartOpen(true)} aria-label="View cart" className="relative text-white/90 hover:text-white">
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gold-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gold-500 text-brick-800 text-center text-xs sm:text-sm font-semibold py-1.5 px-4 flex items-center justify-center gap-1.5">
        <Sparkles size={13} />
        States&amp;Swaad — Crafted &amp; developed by Zoed Shaikh
        <Sparkles size={13} />
      </div>

      {/* bg-brick-800 is a solid fallback behind the photo — without it, a
          slow-loading image would briefly leave white heading text sitting
          on the page's plain white background with nothing to contrast
          against. */}
      <header className="relative overflow-hidden bg-brick-800">
        <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-brick-800/92 via-brick-700/88 to-brick-600/85" />
        <MumbaiSkyline className="absolute bottom-4 inset-x-0 w-full h-12 sm:h-14 text-white/[0.14] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-4 pt-4 pb-5 sm:pt-4 sm:pb-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center shrink-0 ring-1 ring-white/40 text-white transition-colors duration-150"
              >
                <Menu size={18} />
              </button>
              <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center shrink-0 ring-1 ring-white/30">
                <span
                  aria-hidden="true"
                  className="font-heading text-xl leading-none bg-gradient-to-br from-gold-400 to-gold-500 bg-clip-text text-transparent"
                >
                  &amp;
                </span>
              </div>
            </div>

            {isSupabaseConfigured &&
              (user ? (
                <div className="flex items-center gap-1 bg-white/15 backdrop-blur text-white text-xs font-medium pl-3 pr-1 py-1 rounded-full ring-1 ring-white/30 max-w-[55%]">
                  <User size={14} className="shrink-0" />
                  <span className="truncate">{user.email}</span>
                  <button
                    onClick={() => supabase.auth.signOut()}
                    aria-label="Sign out"
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-colors duration-150"
                  >
                    <LogOut size={13} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-150 animate-[popIn_0.4s_ease-out]"
                >
                  <span className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center shrink-0">
                    <User size={12} />
                  </span>
                  Sign in
                </button>
              ))}
          </div>

          <div className="animate-[fadeInUp_0.6s_ease-out_backwards]">
            <span className="inline-flex items-center gap-1 bg-white/15 backdrop-blur text-white text-[11px] font-medium px-2.5 py-1 rounded-full ring-1 ring-white/25 mb-1.5">
              📍 Amchi Mumbai
            </span>
            {/* Split on "&" (not a space — "States&Swaad" is one word) so
                the ampersand gets the gold accent, matching the brand mark,
                while "States"/"Swaad" stay solid white for contrast against
                the photo — a name-length-agnostic version of this treatment
                would need this split logic revisited if the name changes
                to something without an "&" in it. */}
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.1] text-white drop-shadow-sm">
              {shopInfo.name.includes('&') ? (
                <>
                  {shopInfo.name.split('&')[0]}
                  <span className="mx-1.5 bg-gradient-to-br from-gold-400 to-gold-500 bg-clip-text text-transparent">&amp;</span>
                  {shopInfo.name.split('&').slice(1).join('&')}
                </>
              ) : (
                shopInfo.name
              )}
            </h1>
            <p className="text-brick-50 text-sm mt-1 max-w-md">{shopInfo.tagline}</p>
          </div>
        </div>

        <svg
          className="relative block w-full text-brick-50"
          viewBox="0 0 1440 40"
          fill="currentColor"
          preserveAspectRatio="none"
        >
          <path d="M0,32 C240,8 480,0 720,8 C960,16 1200,36 1440,20 L1440,40 L0,40 Z" />
        </svg>
      </header>

      <InfoBar />

      {!orderingOpen && (
        <div className="bg-red-50 border-b border-red-100 text-red-700 text-center text-sm font-semibold py-2.5 px-4 flex items-center justify-center gap-1.5">
          <AlertTriangle size={15} className="shrink-0" />
          {closedReason ? CLOSED_MESSAGE[closedReason] || 'Orders are closed for tonight — check back soon.' : 'Orders are closed for tonight — check back soon.'}
        </div>
      )}

      {/* Intro / trust content comes before the menu on purpose — a new
          visitor should get a sense of what States&Swaad is before being
          dropped straight into a product grid. */}
      <WhyUs />

      <div id="menu-section">
        <CategoryShowcase categories={categories} items={menu} active={activeCategory} onSelect={setActiveCategory} />
        <CategoryNav categories={categories} active={activeCategory} onSelect={setActiveCategory} />
        <SearchAndFilters
          query={searchQuery}
          onQueryChange={setSearchQuery}
          vegOnly={vegOnly}
          onToggleVeg={() => setVegOnly((v) => !v)}
          popularOnly={popularOnly}
          onTogglePopular={() => setPopularOnly((v) => !v)}
        />
      </div>

      {isSearching && (
        <p className="max-w-3xl mx-auto px-4 text-xs text-gray-500 -mb-2">
          {itemsInCategory.length} result{itemsInCategory.length === 1 ? '' : 's'} for "{searchQuery.trim()}"
        </p>
      )}

      <main key={activeCategory} className="max-w-3xl mx-auto px-4 py-6 grid gap-5 sm:grid-cols-2">
        {menuLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white border border-brick-100 overflow-hidden animate-pulse">
                <div className="h-44 w-full bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                </div>
              </div>
            ))
          : itemsInCategory.length === 0
          ? (
              <div className="col-span-full text-center py-10 text-gray-400 text-sm">
                No dishes match {isSearching ? `"${searchQuery.trim()}"` : 'these filters'} right now — try clearing a filter.
              </div>
            )
          : itemsInCategory.map((item, i) => (
              <div
                key={item.id}
                className="animate-[fadeInUp_0.4s_ease-out_backwards]"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <MenuItemCard
                  item={item}
                  onAdd={addToCart}
                  availability={itemStatus[item.id]}
                  orderingClosed={!orderingOpen}
                />
              </div>
            ))}
      </main>

      <Footer />

      {cartLines.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-cream via-cream/95 to-transparent pointer-events-none">
          <div className="max-w-3xl mx-auto px-4 pointer-events-auto">
            <button
              onClick={() => setCartOpen(true)}
              aria-label="View cart"
              className="w-full flex items-center justify-between gap-3 bg-gradient-to-r from-brick-600 to-brick-700 text-white rounded-2xl shadow-glow px-3.5 py-3 hover:shadow-xl transition-all duration-150 active:scale-[0.98] animate-[popIn_0.3s_ease-out]"
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <span ref={cartBtnRef} className="relative w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <ShoppingBag size={17} />
                  <span className="absolute -top-1.5 -right-1.5 bg-gold-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-brick-700">
                    {itemCount}
                  </span>
                </span>
                <span className="text-sm font-semibold truncate">
                  {itemCount} item{itemCount === 1 ? '' : 's'} · ₹{total}
                </span>
              </span>
              <span className="flex items-center gap-0.5 text-sm font-bold bg-white/15 px-3 py-1.5 rounded-full shrink-0">
                View Cart <ChevronRight size={15} />
              </span>
            </button>
          </div>
        </div>
      )}

      <SideMenu
        categories={categories}
        active={activeCategory}
        onSelect={setActiveCategory}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        itemCount={itemCount}
        onOpenCart={() => setCartOpen(true)}
        user={user}
        onOpenAuth={() => setAuthOpen(true)}
        onSignOut={() => supabase.auth.signOut()}
        onOpenMyOrders={() => setMyOrdersOpen(true)}
      />

      <CartDrawer
        lines={cartLines}
        onRemove={removeFromCart}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        profile={profile}
        onSaveProfile={user ? saveProfile : undefined}
        onOrderPlaced={handleOrderPlaced}
      />

      {authOpen && <CustomerAuthModal onClose={() => setAuthOpen(false)} />}

      {myOrdersOpen && (
        <MyOrdersModal
          userId={user?.id}
          menu={menu}
          onClose={() => setMyOrdersOpen(false)}
          onReorder={handleReorder}
        />
      )}

      {toast && (
        <div className="fixed top-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:max-w-sm z-[70] bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg animate-[popIn_0.25s_ease-out]">
          {toast}
        </div>
      )}
    </div>
  )
}

export default App
