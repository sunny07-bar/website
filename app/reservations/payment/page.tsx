'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CreditCard, AlertCircle, CheckCircle } from 'lucide-react'

function PaymentPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reservationId = searchParams.get('reservationId')
  const amount = searchParams.get('amount')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!reservationId || !amount) {
      setError('Missing reservation or payment information')
    }
  }, [reservationId, amount])

  const handlePayPalPayment = async () => {
    if (!reservationId || !amount) {
      setError('Missing reservation or payment information')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create PayPal order
      const response = await fetch('/api/payments/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency: 'USD',
          reservationId,
          description: `Reservation Prepayment - ${reservationId}`,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create payment')
      }

      const { approvalUrl } = await response.json()

      if (approvalUrl) {
        // Redirect to PayPal
        window.location.href = approvalUrl
      } else {
        throw new Error('No approval URL received')
      }
    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.message || 'Failed to initiate payment')
      setLoading(false)
    }
  }

  if (!reservationId || !amount) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="bar-card">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Payment Error</h2>
            <p className="text-gray-600 mb-6">
              Missing reservation or payment information. Please try making a reservation again.
            </p>
            <Button onClick={() => router.push('/reservations')}>
              Back to Reservations
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card className="bar-card shadow-2xl">
        <CardContent className="p-8 md:p-12">
          <div className="text-center mb-8">
            <CreditCard className="h-16 w-16 bar-text-amber mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-extrabold heading-gradient mb-4">
              Complete Your Payment
            </h1>
            <p className="bar-text-muted text-lg">
              Secure payment powered by PayPal
            </p>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-2xl mb-8 border-2 border-orange-200/50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600 font-semibold">Reservation ID:</span>
              <span className="font-bold bar-text-gold">{reservationId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-semibold">Amount Due:</span>
              <span className="text-3xl font-extrabold heading-gradient">
                ${parseFloat(amount).toFixed(2)}
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800">Payment Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Button
              onClick={handlePayPalPayment}
              disabled={loading}
              className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white h-14 text-lg font-bold shadow-xl hover:shadow-2xl transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin inline" />
                  Processing...
                </>
              ) : (
                <>
                  <svg
                    className="mr-2 h-6 w-6 inline"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M7.076 13.674c-.174-1.12.51-2.607 1.811-3.802.91-.85 2.102-1.444 3.418-1.654.19-.03.388-.05.59-.06v-2.913l-2.545.544c-2.939.617-5.301 2.782-6.111 5.537h2.837zm10.11 2.475c1.257.75 2.843.426 4.07-.705 1.216-1.122 1.872-2.75 1.536-4.315-.333-1.565-1.547-2.89-3.117-3.52l-2.489-.532v2.894c.19.01.38.03.57.06 1.315.21 2.507.804 3.418 1.654 1.3 1.195 1.985 2.682 1.811 3.802l-2.836-.198zm-1.392 4.699c-1.693.354-3.54.354-5.233 0-1.693-.355-3.24-1.08-4.432-2.01l-.59 2.789c1.52 1.138 3.304 1.804 5.19 2.01 1.886.205 3.818.205 5.704 0 1.886-.206 3.67-.872 5.19-2.01l-.59-2.789c-1.192.93-2.739 1.655-4.432 2.01zm-1.684-7.373c-1.693.354-3.54.354-5.233 0-1.693-.355-3.24-1.08-4.432-2.01l-.59 2.789c1.52 1.138 3.304 1.804 5.19 2.01 1.886.205 3.818.205 5.704 0 1.886-.206 3.67-.872 5.19-2.01l-.59-2.789c-1.192.93-2.739 1.655-4.432 2.01z" />
                  </svg>
                  Pay with PayPal
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push('/reservations')}
              className="w-full h-12"
            >
              Cancel
            </Button>
          </div>

          <div className="mt-8 text-center text-sm bar-text-muted space-y-2">
            <p>Your reservation will be confirmed once payment is completed.</p>
            <p>You will be redirected to PayPal to complete your payment securely.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12">
        <Card className="bar-card">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-16 w-16 text-orange-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  )
}

