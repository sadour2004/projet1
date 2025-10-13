'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'

interface Product {
  id: string
  name: string
  slug: string
  description?: string | null
  sku?: string | null
  priceCents: number
  currency: string
  stockCached: number
  images: Array<{
    url: string
    alt?: string | null
  }>
  category?: {
    id: string
    name: string
  } | null
}

interface CartItem {
  product: Product
  quantity: number
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (product: Product) => void
  updateCartQuantity: (productId: string, quantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  calculateTotal: () => number
  getCartItemCount: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])

  // Load cart from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('inventory_cart')
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart))
        } catch (error) {
          console.error('Error parsing cart from localStorage:', error)
          localStorage.removeItem('inventory_cart')
        }
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('inventory_cart', JSON.stringify(cart))
    }
  }, [cart])

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.product.id === product.id
      )

      if (existingItem) {
        if (existingItem.quantity + 1 > product.stockCached) {
          return prevCart // Don't add if insufficient stock
        }
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        if (product.stockCached > 0) {
          return [...prevCart, { product, quantity: 1 }]
        }
        return prevCart // Don't add if out of stock
      }
    })
  }

  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart((prevCart) => {
      if (quantity <= 0) {
        return prevCart.filter((item) => item.product.id !== productId)
      } else {
        const product = prevCart.find(
          (item) => item.product.id === productId
        )?.product
        if (product && quantity > product.stockCached) {
          return prevCart // Don't update if insufficient stock
        }
        return prevCart.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      }
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.product.id !== productId)
    )
  }

  const clearCart = () => {
    setCart([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem('inventory_cart')
    }
  }

  const calculateTotal = () => {
    return cart.reduce(
      (sum, item) => sum + item.quantity * (item.product.priceCents / 100),
      0
    )
  }

  const getCartItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }

  const value: CartContextType = {
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    calculateTotal,
    getCartItemCount,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
