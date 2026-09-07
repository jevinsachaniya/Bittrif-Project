import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bittrif_cart') || '[]') } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem('bittrif_cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      const minimumQuantity = product.minimum_order_quantity || 1
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: Math.max(minimumQuantity, i.quantity + quantity) } : i)
      return [...prev, { ...product, quantity: Math.max(minimumQuantity, quantity) }]
    })
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id))

  const updateQty = (id, qty) => {
    if (qty <= 0) return removeFromCart(id)
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(i.minimum_order_quantity || 1, qty) } : i))
  }

  const clearCart = () => setCart([])

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0)
  const totalPrice = cart.reduce((s, i) => s + i.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
