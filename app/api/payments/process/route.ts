import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function POST(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database service unavailable. Please check configuration.' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const {
      type, // 'ticket' or 'reservation'
      orderId,
      reservationId,
      amount,
      paymentMethod = 'credit_card',
    } = body

    // Generate a dummy transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`

    if (type === 'ticket' && orderId) {
      // Dummy payment - call complete-purchase to create tickets and mark as paid
      // Construct base URL from request
      const protocol = request.headers.get('x-forwarded-proto') || 'http'
      const host = request.headers.get('host') || 'localhost:3000'
      const baseUrl = `${protocol}://${host}`
      
      try {
        // Call the complete-purchase endpoint (internal call - creates tickets and marks as paid)
        const completeResponse = await fetch(`${baseUrl}/api/tickets/complete-purchase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            paymentTransactionId: transactionId,
            paymentMethod,
            tickets: [], // Will be fetched from stored selection
          }),
        })

        if (!completeResponse.ok) {
          const errorData = await completeResponse.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || 'Failed to complete ticket purchase')
        }

        const completeData = await completeResponse.json()

        // Create payment record if payments table exists
        try {
          await supabase.from('payments').insert({
            order_id: orderId,
            amount: amount,
            currency: 'USD',
            payment_method: paymentMethod,
            transaction_id: transactionId,
            status: 'completed',
            type: 'ticket',
          })
        } catch (err) {
          // Payments table might not exist, that's okay
          console.log('Payments table not found, skipping payment record creation')
        }

        return NextResponse.json({
          success: true,
          transactionId,
          orderId,
          type: 'ticket',
          redirectUrl: completeData.redirectUrl || `/events/${completeData.eventSlug}/tickets/${orderId}`,
          eventSlug: completeData.eventSlug,
        })
      } catch (fetchError: any) {
        console.error('Failed to call complete-purchase, tickets may not be created:', fetchError.message)
        // Mark order as paid anyway (user can retry or admin can create tickets manually)
        const { data: orderData } = await supabase
          .from('ticket_orders')
          .select('event_id, events(slug)')
          .eq('id', orderId)
          .single()

        const { error: updateError } = await supabase
          .from('ticket_orders')
          .update({
            payment_status: 'paid',
            payment_method: paymentMethod,
            payment_transaction_id: transactionId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)

        if (updateError) {
          throw new Error('Failed to update ticket order payment status')
        }

        // Handle events as object (not array) from Supabase relation
        const eventsData = orderData?.events as any
        const eventSlug = (Array.isArray(eventsData) ? eventsData[0]?.slug : eventsData?.slug) || 'events'
        // Return success but note that tickets creation may have failed
        return NextResponse.json({
          success: true,
          transactionId,
          orderId,
          type: 'ticket',
          redirectUrl: `/events/${eventSlug}/tickets/${orderId}`,
          eventSlug: eventSlug,
          warning: 'Payment processed but ticket creation may have failed. Please check tickets page.',
        })
      }
    } else if (type === 'reservation' && reservationId) {
      // Update reservation payment status
      const { error: updateError } = await supabase
        .from('reservations')
        .update({
          prepayment_status: 'paid',
          payment_status: 'paid',
          payment_method: paymentMethod,
          payment_transaction_id: transactionId,
          payment_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', reservationId)

      if (updateError) {
        throw new Error('Failed to update reservation payment status')
      }

      // Create payment record if payments table exists
      try {
        await supabase.from('payments').insert({
          reservation_id: reservationId,
          amount: amount,
          currency: 'USD',
          payment_method: paymentMethod,
          transaction_id: transactionId,
          status: 'completed',
          type: 'reservation',
        })
      } catch (err) {
        // Payments table might not exist, that's okay
        console.log('Payments table not found, skipping payment record creation')
      }

      return NextResponse.json({
        success: true,
        transactionId,
        reservationId,
        type: 'reservation',
        redirectUrl: `/reservations/payment/success?reservationId=${reservationId}`,
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid payment type or missing ID' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Payment processing error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process payment' },
      { status: 500 }
    )
  }
}

