'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Ticket, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { getEventBySlug } from '@/lib/queries'
import AnimatedSection from '@/components/AnimatedSection'

export default function TicketPurchasePage() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({})
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadEvent()
  }, [params.slug])

  const loadEvent = async () => {
    try {
      const eventData = await getEventBySlug(params.slug as string)
      if (eventData) {
        setEvent(eventData)
        // Initialize quantities
        const initialQuantities: Record<string, number> = {}
        if (eventData.event_tickets && eventData.event_tickets.length > 0) {
          eventData.event_tickets.forEach((ticket: any) => {
            initialQuantities[ticket.id] = 0
          })
        } else if (eventData.base_ticket_price) {
          // Initialize base ticket quantity
          initialQuantities['base'] = 0
        }
        setTicketQuantities(initialQuantities)
      }
    } catch (err) {
      setError('Failed to load event')
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = (ticketId: string, change: number) => {
    setTicketQuantities((prev) => {
      const current = prev[ticketId] || 0
      const ticket = event?.event_tickets?.find((t: any) => t.id === ticketId)
      const available = ticket ? (ticket.quantity_total || 999999) - ticket.quantity_sold : 0
      const newQuantity = Math.max(0, Math.min(available, current + change))
      return { ...prev, [ticketId]: newQuantity }
    })
  }

  const calculateTotal = () => {
    let total = 0
    if (event?.event_tickets && event.event_tickets.length > 0) {
      event.event_tickets.forEach((ticket: any) => {
        const quantity = ticketQuantities[ticket.id] || 0
        total += parseFloat(ticket.price.toString()) * quantity
      })
    } else if (event?.base_ticket_price) {
      // Use base ticket price if no ticket types are defined
      const baseQuantity = ticketQuantities['base'] || 0
      total += parseFloat(event.base_ticket_price.toString()) * baseQuantity
    }
    return total
  }

  const getTotalTickets = () => {
    return Object.values(ticketQuantities).reduce((sum, qty) => sum + qty, 0)
  }

  const updateBaseQuantity = (change: number) => {
    setTicketQuantities((prev) => {
      const current = prev['base'] || 0
      const newQuantity = Math.max(0, current + change)
      return { ...prev, base: newQuantity }
    })
  }

  const handlePurchase = async () => {
    if (!customerInfo.name || !customerInfo.email) {
      setError('Please fill in your name and email')
      return
    }

    const tickets = Object.entries(ticketQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }))

    if (tickets.length === 0) {
      setError('Please select at least one ticket')
      return
    }

    setPurchasing(true)
    setError(null)

    try {
      const response = await fetch('/api/tickets/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          tickets,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to purchase tickets')
      }

      // Check if payment is required
      if (data.paymentRequired && data.paymentUrl && total > 0) {
        // Redirect to payment page
        window.location.href = data.paymentUrl
        return
      }

      // For free tickets ($0), create tickets immediately
      if (total === 0) {
        // Complete the purchase without payment
        const completeResponse = await fetch('/api/tickets/complete-purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: data.order.id,
            paymentTransactionId: 'free-ticket',
            paymentMethod: 'free',
            tickets: tickets,
          }),
        })

        if (!completeResponse.ok) {
          const errorData = await completeResponse.json()
          throw new Error(errorData.error || 'Failed to complete ticket purchase')
        }

        // Send email with tickets
        await fetch('/api/tickets/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: data.order.id,
            customerEmail: customerInfo.email,
          }),
        })

        // Redirect to ticket confirmation page
        router.push(`/events/${encodeURIComponent(params.slug as string)}/tickets/${data.order.id}`)
      } else {
        // This shouldn't happen, but handle it
        throw new Error('Payment required but no payment URL provided')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to purchase tickets')
      setPurchasing(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-red-600" />
        <p>Loading event...</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
        <p>Event not found</p>
      </div>
    )
  }

  const total = calculateTotal()
  const totalTickets = getTotalTickets()

  return (
    <div className="container mx-auto px-4 py-12">
      <AnimatedSection direction="down">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold heading-gradient mb-4">
            Purchase Tickets
          </h1>
          <h2 className="text-2xl font-semibold bar-text-gold">{event.title}</h2>
        </div>
      </AnimatedSection>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket Selection */}
        <div className="lg:col-span-2">
          <AnimatedSection direction="up">
            <Card className="bar-card shadow-2xl">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Ticket className="h-6 w-6 bar-text-amber" />
                  Select Tickets
                </h3>

                {event.event_tickets && event.event_tickets.length > 0 ? (
                  <div className="space-y-4">
                    {event.event_tickets.map((ticket: any) => {
                      const available = (ticket.quantity_total || 999999) - ticket.quantity_sold
                      const quantity = ticketQuantities[ticket.id] || 0

                      return (
                        <div
                          key={ticket.id}
                          className="border-2 border-gray-200 rounded-xl p-6 hover:border-orange-300 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-xl font-bold bar-text-gold">{ticket.name}</h4>
                              <p className="text-3xl font-extrabold heading-gradient mt-2">
                                ${parseFloat(ticket.price.toString()).toFixed(2)}
                              </p>
                            </div>
                            {ticket.quantity_total && (
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                {available} left
                              </span>
                            )}
                          </div>

                          {available > 0 ? (
                            <div className="flex items-center gap-4">
                              <Button
                                variant="outline"
                                onClick={() => updateQuantity(ticket.id, -1)}
                                disabled={quantity === 0}
                                className="h-10 w-10 text-xl"
                              >
                                −
                              </Button>
                              <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
                              <Button
                                variant="outline"
                                onClick={() => updateQuantity(ticket.id, 1)}
                                disabled={quantity >= available}
                                className="h-10 w-10 text-xl"
                              >
                                +
                              </Button>
                              <span className="ml-auto text-lg font-semibold">
                                ${(parseFloat(ticket.price.toString()) * quantity).toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <p className="text-red-600 font-semibold">Sold Out</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : event.base_ticket_price ? (
                  <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-orange-300 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-bold bar-text-gold">General Admission</h4>
                        <p className="text-3xl font-extrabold heading-gradient mt-2">
                          {event.ticket_currency === 'USD' ? '$' : 
                           event.ticket_currency === 'EUR' ? '€' :
                           event.ticket_currency === 'GBP' ? '£' :
                           event.ticket_currency === 'CAD' ? 'C$' :
                           event.ticket_currency === 'AUD' ? 'A$' : '$'}
                          {parseFloat(event.base_ticket_price.toString()).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        onClick={() => updateBaseQuantity(-1)}
                        disabled={(ticketQuantities['base'] || 0) === 0}
                        className="h-10 w-10 text-xl"
                      >
                        −
                      </Button>
                      <span className="text-2xl font-bold w-12 text-center">{ticketQuantities['base'] || 0}</span>
                      <Button
                        variant="outline"
                        onClick={() => updateBaseQuantity(1)}
                        className="h-10 w-10 text-xl"
                      >
                        +
                      </Button>
                      <span className="ml-auto text-lg font-semibold">
                        {event.ticket_currency === 'USD' ? '$' : 
                         event.ticket_currency === 'EUR' ? '€' :
                         event.ticket_currency === 'GBP' ? '£' :
                         event.ticket_currency === 'CAD' ? 'C$' :
                         event.ticket_currency === 'AUD' ? 'A$' : '$'}
                        {(parseFloat(event.base_ticket_price.toString()) * (ticketQuantities['base'] || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-center py-8 text-gray-500">No tickets available</p>
                )}
              </CardContent>
            </Card>
          </AnimatedSection>

          {/* Customer Information */}
          <AnimatedSection direction="up" delay={200}>
            <Card className="bar-card shadow-2xl mt-6">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6">Your Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-base font-semibold mb-2 block">
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      required
                      value={customerInfo.name}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, name: e.target.value })
                      }
                      className="h-12 text-base"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-base font-semibold mb-2 block">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={customerInfo.email}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, email: e.target.value })
                      }
                      className="h-12 text-base"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-base font-semibold mb-2 block">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, phone: e.target.value })
                      }
                      className="h-12 text-base"
                      placeholder="(321) 555-0123"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>

        {/* Order Summary */}
        <div>
          <AnimatedSection direction="up" delay={300}>
            <Card className="bar-card shadow-2xl sticky top-8">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-6">Order Summary</h3>

                <div className="space-y-3 mb-6">
                  {event.event_tickets
                    ?.filter((ticket: any) => (ticketQuantities[ticket.id] || 0) > 0)
                    .map((ticket: any) => {
                      const quantity = ticketQuantities[ticket.id] || 0
                      const price = parseFloat(ticket.price.toString()) * quantity
                      return (
                        <div key={ticket.id} className="flex justify-between text-sm">
                          <span>
                            {ticket.name} × {quantity}
                          </span>
                          <span className="font-semibold">${price.toFixed(2)}</span>
                        </div>
                      )
                    })}
                </div>

                <div className="border-t-2 border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="heading-gradient">${total.toFixed(2)}</span>
                  </div>
                  {totalTickets > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      {totalTickets} ticket{totalTickets !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handlePurchase}
                  disabled={purchasing || totalTickets === 0}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-14 text-lg font-bold shadow-xl"
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin inline" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5 inline" />
                      Purchase Tickets
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  You'll receive your tickets via email after purchase
                </p>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>
      </div>
    </div>
  )
}

