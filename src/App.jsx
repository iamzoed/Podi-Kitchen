import { useState } from 'react'
import { categories, menu, shopInfo } from './data/menu'
import MenuItemCard from './components/MenuItemCard'
import CartDrawer from './components/CartDrawer'
import { cartTotal } from './utils/order'

function App() {
  const [activeCategory, setActiveCategory] = useState(categories[0].id)
  const [cartLines, setCartLines] = useState([])
  const [cartOpen, setCartOpen] = useState(false)

  const itemsInCategory = menu.filter((m) => m.category === activeCategory)
  const total = cartTotal(cartLines)

  function addToCart(line) {
    setCartLines((prev) => [...prev, line])
  }

  function removeFromCart(index) {
    setCartLines((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-brick-600 text-white">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">{shopInfo.name}</h1>
          <p className="text-brick-50 text-sm mt-1">{shopInfo.tagline}</p>
          <p className="text-brick-50 text-xs mt-2 opacity-80">
            {shopInfo.city} · {shopInfo.hours}
          </p>
        </div>
      </header>

      <nav className="sticky top-0 bg-white border-b z-10">
        <div className="max-w-3xl mx-auto px-4 flex gap-2 overflow-x-auto py-3">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap border ${
                c.id === activeCategory
                  ? 'bg-brick-600 text-white border-brick-600'
                  : 'border-gray-300 text-gray-600'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4 pb-24">
        {itemsInCategory.map((item) => (
          <MenuItemCard key={item.id} item={item} onAdd={addToCart} />
        ))}
      </main>

      {cartLines.length > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-brick-700 text-white font-medium px-6 py-3 rounded-full shadow-lg flex items-center gap-3"
        >
          <span>{cartLines.length} item{cartLines.length > 1 ? 's' : ''}</span>
          <span>·</span>
          <span>₹{total}</span>
          <span className="underline">View cart</span>
        </button>
      )}

      {cartOpen && (
        <CartDrawer lines={cartLines} onRemove={removeFromCart} onClose={() => setCartOpen(false)} />
      )}
    </div>
  )
}

export default App
