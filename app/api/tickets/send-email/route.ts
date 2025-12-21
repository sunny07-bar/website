import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { formatFloridaTime, toFloridaTime } from '@/lib/utils/timezone'
import { parseISO } from 'date-fns'

// This endpoint will be called after successful ticket purchase
// It uses Supabase Edge Functions or a service like Resend to send emails
export async function POST(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database service unavailable. Please check configuration.' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { orderId, customerEmail } = body

    if (!orderId || !customerEmail) {
      return NextResponse.json(
        { error: 'Order ID and customer email are required' },
        { status: 400 }
      )
    }

    // Get order and tickets
    const { data: order, error: orderError } = await supabase
      .from('ticket_orders')
      .select(`
        *,
        events (
          id,
          title,
          event_start,
          event_end,
          location
        ),
        purchased_tickets (
          id,
          ticket_number,
          qr_code_data,
          qr_code_hash,
          ticket_type_name,
          price_paid,
          customer_name
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Generate QR code images for each ticket
    const QRCode = (await import('qrcode')).default
    const ticketsWithQR = await Promise.all(
      order.purchased_tickets.map(async (ticket: any) => {
        const qrCodeImage = await QRCode.toDataURL(ticket.qr_code_data, {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          width: 300,
          margin: 2,
        })
        return {
          ...ticket,
          qr_code_image: qrCodeImage,
        }
      })
    )

    // Prepare email content
    const event = order.events
    
    // Format event date and time in Florida EST
    const eventDate = toFloridaTime(event.event_start)
    const eventDateStr = formatFloridaTime(eventDate, 'EEEE, MMMM d, yyyy')
    const eventTimeStr = formatFloridaTime(eventDate, 'h:mm a')
    
    // Format event end time if available
    let eventEndTimeStr = ''
    if (event.event_end) {
      const eventEndDate = toFloridaTime(event.event_end)
      eventEndTimeStr = formatFloridaTime(eventEndDate, 'h:mm a')
    }
    
    const emailSubject = `Your Tickets for ${event.title}`
    
    // HTML email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .ticket { background: white; border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 20px 0; }
            .ticket-header { border-bottom: 2px solid #e5e7eb; padding-bottom: 15px; margin-bottom: 15px; }
            .qr-code { text-align: center; margin: 20px 0; }
            .qr-code img { max-width: 250px; border: 3px solid #dc2626; padding: 10px; background: white; }
            .ticket-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
            .info-item { padding: 10px; background: #f3f4f6; border-radius: 5px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎟️ Your Event Tickets</h1>
              <p>Order #${order.order_number}</p>
            </div>
            <div class="content">
              <h2>${event.title}</h2>
              <p><strong>Date:</strong> ${eventDateStr}</p>
              <p><strong>Time:</strong> ${eventTimeStr} EST${eventEndTimeStr ? ` - ${eventEndTimeStr} EST` : ''}</p>
              ${event.location ? `<p><strong>Location:</strong> ${event.location}</p>` : ''}
              
              <h3 style="margin-top: 30px;">Your Tickets (${ticketsWithQR.length})</h3>
              
              ${ticketsWithQR.map((ticket: any, index: number) => `
                <div class="ticket">
                  <div class="ticket-header">
                    <h3>${ticket.ticket_type_name} - Ticket #${index + 1}</h3>
                    <p><strong>Ticket Number:</strong> ${ticket.ticket_number}</p>
                  </div>
                  <div class="qr-code">
                    <img src="${ticket.qr_code_image}" alt="QR Code" />
                    <p style="margin-top: 10px; font-size: 12px; color: #6b7280;">Scan this QR code at the event entrance</p>
                  </div>
                  <div class="ticket-info">
                    <div class="info-item">
                      <strong>Customer:</strong><br>${ticket.customer_name}
                    </div>
                    <div class="info-item">
                      <strong>Price Paid:</strong><br>$${parseFloat(ticket.price_paid).toFixed(2)}
                    </div>
                  </div>
                </div>
              `).join('')}
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p><strong>⚠️ Important:</strong></p>
                <ul>
                  <li>Each ticket can only be used once</li>
                  <li>Please arrive at least 15 minutes before the event</li>
                  <li>Bring a valid ID that matches the name on the ticket</li>
                  <li>Keep this email safe - you'll need to show the QR code at the entrance</li>
                </ul>
              </div>
              
              <div class="footer">
                <p>Thank you for your purchase!</p>
                <p>If you have any questions, please contact us at support@goodtimesbar.com</p>
                <p style="margin-top: 20px; font-size: 10px; color: #9ca3af;">
                  This is an automated email. Please do not reply.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    // Use Supabase Edge Function or external service to send email
    // For now, we'll use a simple approach with Supabase's built-in email
    // In production, you'd use Resend, SendGrid, or Supabase Edge Functions

    // Store email in queue for processing
    const { data: emailQueue, error: emailQueueError } = await supabase
      .from('email_queue')
      .insert({
        to_email: customerEmail,
        subject: emailSubject,
        html_content: emailHtml,
        status: 'pending',
      })
      .select()
      .single()

    if (emailQueueError) {
      console.error('Email queue error:', emailQueueError)
      // Continue anyway - email can be sent manually later
    } else if (emailQueue) {
      // Trigger Supabase Edge Function to send email (async)
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        if (supabaseUrl) {
          // Call Edge Function (if deployed)
          fetch(`${supabaseUrl}/functions/v1/send-ticket-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({ emailQueueId: emailQueue.id }),
          }).catch(err => {
            console.error('Edge function call failed:', err)
            // Email will be processed by cron job
          })
        }
      } catch (err) {
        console.error('Email trigger error:', err)
        // Email will be processed by cron job
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Email queued for sending',
      orderId: order.id,
      ticketsCount: ticketsWithQR.length,
      emailQueued: !!emailQueue,
    })
  } catch (error: any) {
    console.error('Email sending error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}

