import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { getSpecialHoursForDate, getAvailableTimeSlots } from '@/lib/queries'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'Date parameter required' }, { status: 400 })
    }

    // Get special hours
    const specialHours = await getSpecialHoursForDate(date)
    
    // Get available slots
    const slots = await getAvailableTimeSlots(date, 2)

    // Get regular hours for comparison
    const { data: openingHours } = await supabase
      .from('opening_hours')
      .select('*')
      .order('weekday', { ascending: true })

    const dayOfWeek = new Date(date).getDay()
    const regularHours = openingHours?.find(h => h.weekday === dayOfWeek)

    return NextResponse.json({
      date,
      dayOfWeek,
      specialHours: specialHours ? {
        id: specialHours.id,
        title: specialHours.title,
        is_open: specialHours.is_open,
        time_from: specialHours.time_from,
        time_to: specialHours.time_to,
        status: specialHours.status,
        has_seatings: !!specialHours.special_hours_seatings?.[0],
        seatings: specialHours.special_hours_seatings?.[0] || null,
      } : null,
      regularHours: regularHours || null,
      availableSlots: slots,
      slotsCount: slots.length,
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}

