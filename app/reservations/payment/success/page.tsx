'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

function PaymentSuccessPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const reservationId = searchParams.get('reservationId')
  const PayerID = searchParams.get('PayerID')
  const [processing, setProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Missing payment token')
      setProcessing(false)
      return
    }

    // Extract order ID from token (PayPal returns token as order ID)
    const orderId = token

    // Capture the payment
    const capturePayment = async () => {
      try {
        const response = await fetch('/api/payments/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            reservationId: reservationId || undefined,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to capture payment')
        }

        const data = await response.json()
        setSuccess(true)
        setProcessing(false)
      } catch (err: any) {
        console.error('Capture error:', err)
        setError(err.message || 'Failed to process payment')
        setProcessing(false)
      }
    }

    capturePayment()
  }, [token, reservationId])

  if (processing) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="bar-card">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-16 w-16 text-orange-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold mb-4">Processing Payment...</h2>
            <p className="text-gray-600">Please wait while we confirm your payment.</p>
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
            <div className="space-y-3">
              <Button onClick={() => router.push('/reservations')}>
                Back to Reservations
              </Button>
              <Button variant="outline" onClick={() => router.push('/')}>
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card className="bar-card shadow-2xl">
        <CardContent className="p-8 md:p-12 text-center">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl md:text-4xl font-extrabold heading-gradient mb-4">
            Payment Successful!
          </h1>
          <p className="bar-text-muted text-lg mb-2">
            Your payment has been processed successfully.
          </p>
          {reservationId && (
            <p className="bar-text-muted mb-8">
              Reservation ID: <span className="font-bold bar-text-gold">{reservationId}</span>
            </p>
          )}
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-8">
            <p className="text-green-800 font-semibold">
              Your reservation has been confirmed!
            </p>
            <p className="text-green-700 text-sm mt-2">
              You will receive a confirmation email shortly.
            </p>
          </div>
          <div className="space-y-3">
            <Link href="/reservations">
              <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-12 text-lg font-bold">
                View My Reservations
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full h-12">
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentSuccessPage() {
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
      <PaymentSuccessPageContent />
    </Suspense>
  )
}

