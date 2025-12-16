'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShoppingCart, Plus, Minus, Trash2, MapPin, Clock } from 'lucide-react'
import { getMenuItems } from '@/lib/queries'

type CartItem = {
  id: string
  name: string
  variantName?: string
  price: number
  quantity: number
  itemId?: string
  variantId?: string
}

export default function OrderPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [orderType, setOrderType] = useState<'pickup' | 'delivery' | 'dine_in'>('pickup')
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  })
  const [scheduledTime, setScheduledTime] = useState('')
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMenuItems() {
      try {
        const items = await getMenuItems()
        setMenuItems(items)
      } catch (error) {
        console.error('Error loading menu items:', error)
      } finally {
        setLoading(false)
      }
    }
    loadMenuItems()
  }, [])

  const addToCart = (item: any) => {
    const price = item.menu_item_variants && item.menu_item_variants.length > 0
      ? item.menu_item_variants[0].price
      : item.base_price || 0
    
    const variant = item.menu_item_variants && item.menu_item_variants.length > 0
      ? item.menu_item_variants[0]
      : null

    const cartItem: CartItem = {
      id: variant ? `${item.id}-${variant.id}` : item.id,
      name: item.name,
      variantName: variant?.name,
      price: price,
      quantity: 1,
      itemId: item.id,
      variantId: variant?.id,
    }

    setCart(prev => {
      const existing = prev.find(c => c.id === cartItem.id)
      if (existing) {
        return prev.map(c =>
          c.id === cartItem.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      }
      return [...prev, cartItem]
    })
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newQuantity = item.quantity + delta
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item
        }
        return item
      }).filter(item => item.quantity > 0)
    )
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.08 // 8% tax
  const total = subtotal + tax

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType,
          customerInfo,
          cart: cart.map(item => ({
            name: item.name,
            variantName: item.variantName,
            price: item.price,
            quantity: item.quantity,
            itemId: item.itemId,
            variantId: item.variantId,
          })),
          scheduledTime,
          subtotal,
          tax,
          total,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Order placed successfully! Order number: ${data.order.orderNumber}`)
        setCart([])
        setCustomerInfo({ name: '', phone: '', email: '', address: '' })
        setScheduledTime('')
      } else {
        alert('Failed to place order. Please try again.')
      }
    } catch (error) {
      console.error('Order error:', error)
      alert('An error occurred. Please try again.')
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Order Online</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Menu Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Menu Items</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading menu...</p>
                </div>
              ) : menuItems.length > 0 ? (
                <div className="space-y-4">
                  {menuItems.map((item) => {
                    const price = item.menu_item_variants && item.menu_item_variants.length > 0
                      ? item.menu_item_variants[0].price
                      : item.base_price || 0
                    return (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-gray-600">${price.toFixed(2)}</p>
                          {item.description && (
                            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No menu items available.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cart & Checkout */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Your Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Your cart is empty</p>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{item.name}</p>
                          <p className="text-xs text-gray-600">
                            ${item.price.toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromCart(item.id)}
                            className="ml-2 text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2 mb-6">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Order Type */}
                    <div>
                      <Label>Order Type</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <Button
                          type="button"
                          variant={orderType === 'pickup' ? 'default' : 'outline'}
                          onClick={() => setOrderType('pickup')}
                          className={orderType === 'pickup' ? 'bg-red-600' : ''}
                        >
                          Pickup
                        </Button>
                        <Button
                          type="button"
                          variant={orderType === 'delivery' ? 'default' : 'outline'}
                          onClick={() => setOrderType('delivery')}
                          className={orderType === 'delivery' ? 'bg-red-600' : ''}
                        >
                          Delivery
                        </Button>
                        <Button
                          type="button"
                          variant={orderType === 'dine_in' ? 'default' : 'outline'}
                          onClick={() => setOrderType('dine_in')}
                          className={orderType === 'dine_in' ? 'bg-red-600' : ''}
                        >
                          Dine In
                        </Button>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        required
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        required
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      />
                    </div>

                    {orderType === 'delivery' && (
                      <div>
                        <Label htmlFor="address">Delivery Address *</Label>
                        <Input
                          id="address"
                          required
                          value={customerInfo.address}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="scheduledTime">Scheduled Time (Optional)</Label>
                      <Input
                        id="scheduledTime"
                        type="datetime-local"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      Place Order
                    </Button>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

