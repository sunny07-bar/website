'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CreditCard, AlertCircle, CheckCircle, Ticket, Lock } from 'lucide-react'

function TicketPaymentPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const params = useParams()
  const orderId = searchParams.get('orderId')
  const amount = searchParams.get('amount')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    zipCode: '',
  })

  useEffect(() => {
    if (!orderId || !amount) {
      setError('Missing order or payment information')
    }
  }, [orderId, amount])

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  const handleCardInputChange = (field: string, value: string) => {
    if (field === 'cardNumber') {
      value = formatCardNumber(value)
    } else if (field === 'expiryDate') {
      value = formatExpiryDate(value)
    } else if (field === 'cvv') {
      value = value.replace(/\D/g, '').substring(0, 4)
    }
    setCardData({ ...cardData, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!orderId || !amount) {
      setError('Missing order or payment information')
      return
    }

    // Basic validation
    if (!cardData.cardNumber || cardData.cardNumber.replace(/\s/g, '').length < 13) {
      setError('Please enter a valid card number')
      return
    }
    if (!cardData.cardName) {
      setError('Please enter cardholder name')
      return
    }
    if (!cardData.expiryDate || cardData.expiryDate.length < 5) {
      setError('Please enter a valid expiry date (MM/YY)')
      return
    }
    if (!cardData.cvv || cardData.cvv.length < 3) {
      setError('Please enter a valid CVV')
      return
    }
    if (!cardData.zipCode) {
      setError('Please enter zip code')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/payments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ticket',
          orderId,
          amount: parseFloat(amount),
          paymentMethod: 'credit_card',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process payment')
      }

      // Redirect to success page
      if (data.redirectUrl) {
        router.push(data.redirectUrl)
      } else {
        router.push(`/events/${params.slug}/tickets/${orderId}`)
      }
    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.message || 'Failed to process payment')
      setLoading(false)
    }
  }

  if (!orderId || !amount) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="bar-card">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Payment Error</h2>
            <p className="text-gray-600 mb-6">
              Missing order or payment information. Please try purchasing tickets again.
            </p>
            <Button onClick={() => router.push(`/events/${params.slug}`)}>
              Back to Event
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
            <Ticket className="h-16 w-16 bar-text-amber mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-extrabold heading-gradient mb-4">
              Complete Your Payment
            </h1>
            <p className="bar-text-muted text-lg">
              Secure credit card payment
            </p>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-2xl mb-8 border-2 border-orange-200/50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600 font-semibold">Order ID:</span>
              <span className="font-bold bar-text-gold">{orderId}</span>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Credit Card Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="cardName" className="text-base font-semibold mb-2 block">
                  Cardholder Name *
                </Label>
                <Input
                  id="cardName"
                  required
                  value={cardData.cardName}
                  onChange={(e) => handleCardInputChange('cardName', e.target.value)}
                  placeholder="John Doe"
                  className="h-12 text-base"
                />
              </div>

              <div>
                <Label htmlFor="cardNumber" className="text-base font-semibold mb-2 block">
                  Card Number *
                </Label>
                <Input
                  id="cardNumber"
                  required
                  value={cardData.cardNumber}
                  onChange={(e) => handleCardInputChange('cardNumber', e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="h-12 text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate" className="text-base font-semibold mb-2 block">
                    Expiry Date *
                  </Label>
                  <Input
                    id="expiryDate"
                    required
                    value={cardData.expiryDate}
                    onChange={(e) => handleCardInputChange('expiryDate', e.target.value)}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="h-12 text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="cvv" className="text-base font-semibold mb-2 block">
                    CVV *
                  </Label>
                  <Input
                    id="cvv"
                    required
                    type="password"
                    value={cardData.cvv}
                    onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                    placeholder="123"
                    maxLength={4}
                    className="h-12 text-base"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="zipCode" className="text-base font-semibold mb-2 block">
                  Zip Code *
                </Label>
                <Input
                  id="zipCode"
                  required
                  value={cardData.zipCode}
                  onChange={(e) => handleCardInputChange('zipCode', e.target.value)}
                  placeholder="12345"
                  className="h-12 text-base"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
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
                type="submit"
              disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-14 text-lg font-bold shadow-xl hover:shadow-2xl transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin inline" />
                    Processing Payment...
                </>
              ) : (
                <>
                    <Lock className="mr-2 h-5 w-5 inline" />
                    Complete Payment
                </>
              )}
            </Button>

            <Button
                type="button"
              variant="outline"
              onClick={() => router.push(`/events/${params.slug}`)}
              className="w-full h-12"
            >
              Cancel
            </Button>
          </div>

            <div className="mt-6 text-center text-sm bar-text-muted space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Lock className="h-4 w-4" />
                <p>Your payment is secure and encrypted</p>
              </div>
            <p>Your tickets will be confirmed once payment is completed.</p>
          </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TicketPaymentPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12">
        <Card className="bar-card">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-16 w-16 text-orange-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading payment page...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <TicketPaymentPageContent />
    </Suspense>
  )
}

