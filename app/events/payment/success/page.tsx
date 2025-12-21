'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2, AlertCircle, Ticket } from 'lucide-react'
import { supabase } from '@/lib/db'

function TicketPaymentSuccessPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const orderId = searchParams.get('orderId')
  const PayerID = searchParams.get('PayerID')
  const [processing, setProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [eventSlug, setEventSlug] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !orderId) {
      setError('Missing payment information')
      setProcessing(false)
      return
    }

    // Extract order ID from token (PayPal returns token as order ID)
    const paypalOrderId = token

    // Capture the payment
    const capturePayment = async () => {
      try {
        const response = await fetch('/api/payments/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: paypalOrderId,
            ticketOrderId: orderId,
            type: 'ticket',
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to capture payment')
        }

        // Get event slug for redirect
        if (!supabase) {
          console.error('Supabase client not available')
          return
        }
        
        const { data: ticketOrder } = await supabase
          .from('ticket_orders')
          .select('events(slug)')
          .eq('id', orderId)
          .single()

        const events = ticketOrder?.events as any
        if (events && !Array.isArray(events) && events.slug) {
          setEventSlug(events.slug)
        }

        setSuccess(true)
        setProcessing(false)
      } catch (err: any) {
        console.error('Capture error:', err)
        setError(err.message || 'Failed to process payment')
        setProcessing(false)
      }
    }

    capturePayment()
  }, [token, orderId])

  if (processing) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="bar-card">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-16 w-16 text-orange-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold mb-4">Processing Payment...</h2>
            <p className="text-gray-600">Please wait while we confirm your payment and create your tickets.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="bar-card">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Payment Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.push('/events')}>
              Back to Events
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success && eventSlug) {
    // Redirect to ticket page
    router.push(`/events/${encodeURIComponent(eventSlug)}/tickets/${orderId}`)
    return null
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card className="bar-card">
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your payment has been processed. Redirecting to your tickets...
          </p>
          {eventSlug && (
            <Button onClick={() => router.push(`/events/${encodeURIComponent(eventSlug)}/tickets/${orderId}`)}>
              View Your Tickets
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function TicketPaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="bar-card">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-16 w-16 text-orange-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <TicketPaymentSuccessPageContent />
    </Suspense>
  )
}

