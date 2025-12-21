import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import QRCode from 'qrcode'

export async function GET(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database service unavailable. Please check configuration.' },
      { status: 503 }
    )
  }

  try {
    const { data: ticket, error } = await supabase
      .from('purchased_tickets')
      .select(`
        *,
        ticket_orders (
          *,
          events (
            id,
            title,
            event_start,
            event_end,
            location
          )
        )
      `)
      .eq('id', params.ticketId)
      .single()

    if (error || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Generate QR code image
    const qrCodeImage = await QRCode.toDataURL(ticket.qr_code_data, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
    })

    return NextResponse.json({
      ticket: {
        ...ticket,
        qr_code_image: qrCodeImage,
      },
    })
  } catch (error: any) {
    console.error('Get ticket error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

