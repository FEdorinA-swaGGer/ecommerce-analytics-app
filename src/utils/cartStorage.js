const CART_KEY = 'cart_items'

export const getCartItems = () => {
  const raw = localStorage.getItem(CART_KEY)
  if (!raw) return []

  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export const saveCartItems = (items) => {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
  // Same-tab updates don't fire the native storage event; Header listens for this custom event too.
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('storage'))
  }
}

export const addToCart = (product) => {
  const items = getCartItems()
  const nextItems = [...items, product]
  saveCartItems(nextItems)
  return nextItems
}

export const removeFromCartByIndex = (index) => {
  const items = getCartItems()
  const nextItems = items.filter((_, itemIndex) => itemIndex !== index)
  saveCartItems(nextItems)
  return nextItems
}

export const clearCart = () => {
  saveCartItems([])
  return []
}
