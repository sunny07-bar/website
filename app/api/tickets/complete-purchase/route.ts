import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import crypto from 'crypto'
import QRCode from 'qrcode'

// Helper to generate ticket number
async function generateTicketNumber(): Promise<string> {
  if (!supabase) {
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `TKT-${dateStr}-${random}`
  }

  try {
    const { data: ticketNumberData, error: rpcError } = await supabase.rpc('generate_ticket_number')
    if (rpcError || !ticketNumberData) {
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
      const random = Math.random().toString(36).substring(2, 8).toUpperCase()
      return `TKT-${dateStr}-${random}`
    }
    return ticketNumberData
  } catch (e) {
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `TKT-${dateStr}-${random}`
  }
}

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
      orderId,
      paymentTransactionId,
      paymentMethod = 'paypal',
      tickets, // Array of { ticketTypeId, quantity } - same format as purchase
    } = body

    if (!orderId || !paymentTransactionId) {
      return NextResponse.json(
        { error: 'Order ID and payment transaction ID are required' },
        { status: 400 }
      )
    }

    // Get the order first
    const { data: order, error: orderError } = await supabase
      .from('ticket_orders')
      .select(`
        *,
        events (*)
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if already paid
    if (order.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Order already paid' },
        { status: 400 }
      )
    }

    // Extract event early so we can use it in reconstruction
    const event = order.events

    // Get ticket selection from stored selection (tickets param is optional, we'll fetch from DB)
    let ticketSelection = tickets
    
    // Try to get from stored selection first (more reliable)
    // Handle case where table doesn't exist gracefully
    try {
      const { data: storedSelection } = await supabase
        .from('ticket_order_selections')
        .select('ticket_selection')
        .eq('ticket_order_id', orderId)
        .single()
      
      if (storedSelection && storedSelection.ticket_selection) {
        ticketSelection = storedSelection.ticket_selection
      }
    } catch (err) {
      // Table doesn't exist or error - that's okay, try to use tickets param or reconstruct
      console.log('Could not fetch from ticket_order_selections, using provided tickets or reconstructing')
    }
    
    // If still no selection, try to reconstruct from order and event
    if (!ticketSelection || ticketSelection.length === 0) {
      // Reconstruct ticket selection from order total and event base price
      if (event && event.base_ticket_price && order.total_amount) {
        const quantity = Math.round(parseFloat(order.total_amount.toString()) / parseFloat(event.base_ticket_price.toString()))
        if (quantity > 0) {
          ticketSelection = [{ ticketTypeId: 'base', quantity }]
          console.log(`Reconstructed ticket selection: ${quantity} base tickets`)
        }
      }
    }
    
    // Final check - if still no selection, return error
    if (!ticketSelection || ticketSelection.length === 0) {
      return NextResponse.json(
        { error: 'Ticket selection not found. Please try purchasing again.' },
        { status: 400 }
      )
    }
    const customerName = order.customer_name
    const customerEmail = order.customer_email

    // Update order payment status
    const { error: updateError } = await supabase
      .from('ticket_orders')
      .update({
        payment_status: 'paid',
        payment_method: paymentMethod,
        payment_transaction_id: paymentTransactionId,
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order:', updateError)
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      )
    }

    // Now create the tickets
    const purchasedTickets = []
    const ticketValidations = []

    // Validate and prepare tickets (use ticketSelection which was fetched from storage)
    for (const ticketItem of ticketSelection) {
      if (ticketItem.ticketTypeId === 'base') {
        if (!event.base_ticket_price) {
          return NextResponse.json(
            { error: 'Base ticket price not set for this event' },
            { status: 400 }
          )
        }
        ticketValidations.push({
          ticketType: {
            id: 'base',
            name: 'General Admission',
            price: event.base_ticket_price,
            quantity_total: null,
            quantity_sold: 0,
            currency: event.ticket_currency || 'USD',
          },
          quantity: ticketItem.quantity,
        })
        continue
      }

      const { data: ticketType, error: ticketError } = await supabase
        .from('event_tickets')
        .select('*')
        .eq('id', ticketItem.ticketTypeId)
        .eq('event_id', order.event_id)
        .single()

      if (ticketError || !ticketType) {
        return NextResponse.json(
          { error: `Ticket type ${ticketItem.ticketTypeId} not found` },
          { status: 404 }
        )
      }

      // Check availability
      const available = (ticketType.quantity_total || 999999) - ticketType.quantity_sold
      if (ticketItem.quantity > available) {
        return NextResponse.json(
          { error: `Only ${available} ${ticketType.name} tickets available` },
          { status: 400 }
        )
      }

      ticketValidations.push({ ticketType, quantity: ticketItem.quantity })
    }

    // Create tickets
    for (const validation of ticketValidations) {
      const { ticketType, quantity } = validation

      // Handle base ticket price
      let actualTicketTypeId = ticketType.id
      if (ticketType.id === 'base') {
        // Check if default ticket type exists
        const { data: existingDefaultTicket } = await supabase
          .from('event_tickets')
          .select('id')
          .eq('event_id', order.event_id)
          .eq('name', 'General Admission')
          .single()

        if (existingDefaultTicket) {
          actualTicketTypeId = existingDefaultTicket.id
        } else {
          // Create default ticket type
          const { data: newTicketType, error: ticketTypeError } = await supabase
            .from('event_tickets')
            .insert({
              event_id: order.event_id,
              name: 'General Admission',
              price: event.base_ticket_price,
              currency: event.ticket_currency || 'USD',
              quantity_total: null,
              quantity_sold: 0,
            })
            .select()
            .single()

          if (ticketTypeError || !newTicketType) {
            console.error('Error creating default ticket type:', ticketTypeError)
            continue
          }
          actualTicketTypeId = newTicketType.id
        }
      }

      for (let i = 0; i < quantity; i++) {
        const ticketNumber = await generateTicketNumber()

        const qrData = JSON.stringify({
          ticketId: crypto.randomUUID(),
          orderId: order.id,
          eventId: order.event_id,
          ticketNumber: ticketNumber,
          timestamp: Date.now(),
        })

        const qrHash = crypto.createHash('sha256').update(qrData).digest('hex')

        const qrCodeImage = await QRCode.toDataURL(qrData, {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          width: 300,
          margin: 2,
        })

        const { data: purchasedTicket, error: ticketError } = await supabase
          .from('purchased_tickets')
          .insert({
            ticket_order_id: order.id,
            event_ticket_id: actualTicketTypeId,
            ticket_number: ticketNumber,
            qr_code_data: qrData,
            qr_code_hash: qrHash,
            status: 'valid',
            customer_name: customerName,
            ticket_type_name: ticketType.name,
            price_paid: parseFloat(ticketType.price.toString()),
          })
          .select()
          .single()

        if (ticketError) {
          console.error('Ticket creation error:', ticketError)
          continue
        }

        purchasedTickets.push({
          ...purchasedTicket,
          qr_code_image: qrCodeImage,
        })
      }

      // Update ticket type quantity sold
      if (ticketType.id !== 'base') {
        await supabase
          .from('event_tickets')
          .update({ quantity_sold: (ticketType.quantity_sold || 0) + quantity })
          .eq('id', ticketType.id)
      } else {
        // Update default ticket type quantity
        const { data: currentTicketType } = await supabase
          .from('event_tickets')
          .select('quantity_sold')
          .eq('id', actualTicketTypeId)
          .single()
        
        if (currentTicketType) {
          await supabase
            .from('event_tickets')
            .update({ quantity_sold: (currentTicketType.quantity_sold || 0) + quantity })
            .eq('id', actualTicketTypeId)
        }
      }
    }

    // Delete stored ticket selection (no longer needed)
    // Note: This table may not exist, so we'll catch the error gracefully
    try {
      await supabase
        .from('ticket_order_selections')
        .delete()
        .eq('ticket_order_id', orderId)
    } catch (err) {
      // Table doesn't exist or error - that's okay, continue
      console.log('Note: ticket_order_selections table not found, skipping cleanup')
    }

    // Send email with tickets (use absolute URL for server-side fetch)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    fetch(`${siteUrl}/api/tickets/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        customerEmail: customerEmail,
      }),
    }).catch(err => {
      console.error('Email queue error:', err)
    })

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        totalAmount: order.total_amount,
        status: order.status,
      },
      tickets: purchasedTickets,
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
      },
      redirectUrl: `/events/${event.slug}/tickets/${order.id}`,
      eventSlug: event.slug,
    })
  } catch (error: any) {
    console.error('Complete ticket purchase error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

