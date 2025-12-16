import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { getEventsForDate, checkEventConflict } from '@/lib/queries'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerName,
      customerPhone,
      customerEmail,
      guestsCount,
      reservationDate,
      reservationTime,
      notes,
      specialHoursId,
      customFields,
    } = body

    // Validate required fields
    if (!customerName || !customerPhone || !guestsCount || !reservationDate || !reservationTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate guests count
    if (guestsCount < 1 || guestsCount > 12) {
      return NextResponse.json(
        { error: 'Guests count must be between 1 and 12' },
        { status: 400 }
      )
    }

    // Check for event conflicts (with 2-hour buffer before/after event)
    const events = await getEventsForDate(reservationDate)
    if (events.length > 0) {
      const { hasConflict, conflictingEvent } = checkEventConflict(
        reservationDate,
        reservationTime,
        events,
        120 // 2-hour buffer
      )

      if (hasConflict && conflictingEvent) {
        const eventStart = new Date(conflictingEvent.event_start)
        const eventEnd = conflictingEvent.event_end 
          ? new Date(conflictingEvent.event_end)
          : new Date(eventStart.getTime() + 3 * 60 * 60 * 1000)
        
        const formatTime = (date: Date) => {
          return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })
        }

        return NextResponse.json(
          { 
            error: `This time conflicts with an event: "${conflictingEvent.title}" (${formatTime(eventStart)} - ${formatTime(eventEnd)}). Please select a different time or purchase event tickets instead.`,
            eventConflict: true,
            event: {
              id: conflictingEvent.id,
              title: conflictingEvent.title,
              slug: conflictingEvent.slug,
              event_start: conflictingEvent.event_start,
              event_end: conflictingEvent.event_end,
            }
          },
          { status: 400 }
        )
      }
    }

    // If special hours, check limits and availability
    let prepaymentAmount = null
    if (specialHoursId) {
      // Get special hours limits
      const { data: limits } = await supabase
        .from('special_hours_limits')
        .select('*')
        .eq('special_hours_id', specialHoursId)
        .single()

      if (limits) {
        // Check max guests per booking
        if (limits.max_guests_per_booking && guestsCount > limits.max_guests_per_booking) {
          return NextResponse.json(
            { error: `Maximum ${limits.max_guests_per_booking} guests per booking allowed` },
            { status: 400 }
          )
        }

        // Check max bookings total
        if (limits.max_bookings_total) {
          const { count } = await supabase
            .from('reservations')
            .select('*', { count: 'exact', head: true })
            .eq('reservation_date', reservationDate)
            .eq('special_hours_id', specialHoursId)
            .in('status', ['pending', 'confirmed'])

          if (count && count >= limits.max_bookings_total) {
            return NextResponse.json(
              { error: 'Maximum bookings reached for this date' },
              { status: 400 }
            )
          }
        }

        // Check max guests total
        if (limits.max_guests_total) {
          const { data: reservations } = await supabase
            .from('reservations')
            .select('guests_count')
            .eq('reservation_date', reservationDate)
            .eq('special_hours_id', specialHoursId)
            .in('status', ['pending', 'confirmed'])

          const currentGuests = reservations?.reduce((sum, r) => sum + (r.guests_count || 0), 0) || 0
          if (currentGuests + guestsCount > limits.max_guests_total) {
            return NextResponse.json(
              { error: 'Maximum guest capacity reached for this date' },
              { status: 400 }
            )
          }
        }
      }

      // Get payment info for prepayment
      const { data: payment } = await supabase
        .from('special_hours_payment')
        .select('*')
        .eq('special_hours_id', specialHoursId)
        .single()

      // Calculate prepayment if required
      if (payment?.prepayment_required) {
        if (payment.prepayment_rule_type === 'per_guest' && payment.prepayment_amount) {
          prepaymentAmount = payment.prepayment_amount * guestsCount
        } else if (payment.prepayment_rule_type === 'per_booking' && payment.prepayment_amount) {
          prepaymentAmount = payment.prepayment_amount
        }
        // Note: Percentage prepayment would need total booking cost
      }

      // Insert reservation into database
      const { data, error } = await supabase
        .from('reservations')
        .insert({
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail || null,
          guests_count: guestsCount,
          reservation_date: reservationDate,
          reservation_time: reservationTime,
          notes: notes || null,
          status: 'pending',
          special_hours_id: specialHoursId,
          prepayment_amount: prepaymentAmount,
          prepayment_status: prepaymentAmount ? 'unpaid' : null,
        })
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json(
          { error: 'Failed to create reservation' },
          { status: 500 }
        )
      }

      // Insert custom field responses
      if (customFields && Object.keys(customFields).length > 0) {
        // Get field IDs
        const { data: fields } = await supabase
          .from('special_hours_fields')
          .select('id, field_key')
          .eq('special_hours_id', specialHoursId)

        if (fields) {
          const fieldResponses = fields
            .filter((field) => customFields[field.field_key])
            .map((field) => ({
              reservation_id: data.id,
              field_id: field.id,
              field_value: customFields[field.field_key],
            }))

          if (fieldResponses.length > 0) {
            await supabase.from('reservation_field_responses').insert(fieldResponses)
          }
        }
      }

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      
      return NextResponse.json(
        { 
          success: true, 
          reservation: data, 
          prepaymentRequired: !!prepaymentAmount, 
          prepaymentAmount,
          paymentUrl: prepaymentAmount 
            ? `${siteUrl}/reservations/payment?reservationId=${data.id}&amount=${prepaymentAmount}`
            : null
        },
        { status: 201 }
      )
    } else {
      // Regular reservation (no special hours)
      const { data, error } = await supabase
        .from('reservations')
        .insert({
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail || null,
          guests_count: guestsCount,
          reservation_date: reservationDate,
          reservation_time: reservationTime,
          notes: notes || null,
          status: 'pending',
        })
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json(
          { error: 'Failed to create reservation' },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { success: true, reservation: data },
        { status: 201 }
      )
    }
  } catch (error) {
    console.error('Reservation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

