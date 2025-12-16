import { supabase } from './db'
import { getFloridaNow } from './utils/timezone'

// Helper to log query errors with more detail
function logQueryError(functionName: string, error: any, table?: string) {
  console.error(`[${functionName}] Error fetching from ${table || 'database'}:`, {
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
  })
}

// Banners
export async function getBanners() {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      logQueryError('getBanners', error, 'banners')
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error in getBanners:', error)
    return []
  }
}

// Menu Categories
export async function getMenuCategories() {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      logQueryError('getMenuCategories', error, 'menu_categories')
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error in getMenuCategories:', error)
    return []
  }
}

// Menu Items
export async function getMenuItems(categoryId?: string) {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return []
    }

    let query = supabase
      .from('menu_items')
      .select(`
        *,
        menu_item_variants (*)
      `)
      .eq('is_available', true)

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      logQueryError('getMenuItems', error, 'menu_items')
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error in getMenuItems:', error)
    return []
  }
}

export async function getFeaturedMenuItems() {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        menu_item_variants (*),
        menu_categories (*)
      `)
      .eq('is_featured', true)
      .eq('is_available', true)
      .limit(6)
      .order('created_at', { ascending: false })

    if (error) {
      logQueryError('getFeaturedMenuItems', error, 'menu_items')
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error in getFeaturedMenuItems:', error)
    return []
  }
}

export async function getMenuItemById(id: string) {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return null
    }

    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        menu_item_variants (*),
        menu_categories (*)
      `)
      .eq('id', id)
      .eq('is_available', true)
      .single()

    if (error) {
      logQueryError('getMenuItemById', error, 'menu_items')
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error in getMenuItemById:', error)
    return null
  }
}

// Events
export async function getEvents(featured?: boolean) {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return []
    }

    let query = supabase
      .from('events')
      .select('*')
      .order('event_start', { ascending: true })

    if (featured) {
      query = query.eq('is_featured', true)
    }

    // Don't filter by status - fetch all events
    // The frontend will handle filtering for upcoming events

    const { data, error } = await query

    if (error) {
      logQueryError('getEvents', error, 'events')
      return []
    }
    
    console.log(`[getEvents] Fetched ${data?.length || 0} events`)
    return data || []
  } catch (error) {
    console.error('Error in getEvents:', error)
    return []
  }
}

export async function getEventBySlug(slug: string) {
  try {
    // Decode URL-encoded slug (handles %20 for spaces, etc.)
    const decodedSlug = decodeURIComponent(slug)
    
    // Try exact match first (with decoded slug)
    let { data, error } = await supabase
      .from('events')
      .select(`
        *,
        event_tickets (*)
      `)
      .eq('slug', decodedSlug)
      .single()

    // If not found, try with the original slug (in case it's stored as-is)
    if (error && slug !== decodedSlug) {
      const { data: data2, error: error2 } = await supabase
        .from('events')
        .select(`
          *,
          event_tickets (*)
        `)
        .eq('slug', slug)
        .single()
      
      if (!error2) {
        data = data2
        error = null
      }
    }

    // If still not found, try case-insensitive match (some databases are case-sensitive)
    if (error) {
      const { data: data3, error: error3 } = await supabase
        .from('events')
        .select(`
          *,
          event_tickets (*)
        `)
        .ilike('slug', decodedSlug)
        .single()
      
      if (!error3) {
        data = data3
        error = null
      }
    }

    if (error) {
      console.error('Error fetching event:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        searchedSlug: decodedSlug,
        originalSlug: slug
      })
      return null
    }
    return data
  } catch (error) {
    console.error('Error in getEventBySlug:', error)
    return null
  }
}

export async function getUpcomingEvents(limit?: number) {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return []
    }

    const now = getFloridaNow().toISOString()
    let query = supabase
      .from('events')
      .select('*')
      .gte('event_start', now)
      .order('event_start', { ascending: true })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      logQueryError('getUpcomingEvents', error, 'events')
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error in getUpcomingEvents:', error)
    return []
  }
}

// Get events on a specific date
export async function getEventsForDate(date: string) {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return []
    }

    // Get start and end of the date
    const dateStart = new Date(date)
    dateStart.setHours(0, 0, 0, 0)
    const dateEnd = new Date(date)
    dateEnd.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'upcoming')
      .gte('event_start', dateStart.toISOString())
      .lte('event_start', dateEnd.toISOString())
      .order('event_start', { ascending: true })

    if (error) {
      logQueryError('getEventsForDate', error, 'events')
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error in getEventsForDate:', error)
    return []
  }
}

// Check if a reservation time conflicts with any events (with buffer)
// Buffer defaults to 2 hours (120 minutes) before and after event
export function checkEventConflict(
  reservationDate: string,
  reservationTime: string,
  events: any[],
  bufferMinutes: number = 120
): { hasConflict: boolean; conflictingEvent: any | null } {
  if (!events || events.length === 0) {
    return { hasConflict: false, conflictingEvent: null }
  }

  // Parse reservation date and time
  const [resHour, resMin] = reservationTime.split(':').map(Number)
  const reservationDateTime = new Date(reservationDate)
  reservationDateTime.setHours(resHour, resMin, 0, 0)

  for (const event of events) {
    if (!event.event_start) continue

    const eventStart = new Date(event.event_start)
    const eventEnd = event.event_end 
      ? new Date(event.event_end)
      : new Date(eventStart.getTime() + 3 * 60 * 60 * 1000) // Default 3 hours if no end time

    // Apply buffer: subtract buffer before start, add buffer after end
    const blockedStart = new Date(eventStart.getTime() - bufferMinutes * 60 * 1000)
    const blockedEnd = new Date(eventEnd.getTime() + bufferMinutes * 60 * 1000)

    // Check if reservation time falls within blocked period
    if (reservationDateTime >= blockedStart && reservationDateTime <= blockedEnd) {
      return { hasConflict: true, conflictingEvent: event }
    }
  }

  return { hasConflict: false, conflictingEvent: null }
}

// Check if a time slot conflicts with any events (with buffer)
export function isTimeSlotBlockedByEvent(
  date: string,
  timeSlot: string,
  events: any[],
  bufferMinutes: number = 120
): boolean {
  const { hasConflict } = checkEventConflict(date, timeSlot, events, bufferMinutes)
  return hasConflict
}

// Offers
export async function getActiveOffers() {
  try {
    const now = getFloridaNow().toISOString()
    let query = supabase
      .from('offers')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error('Error fetching offers:', error)
      return []
    }

    const filtered = (data || []).filter((offer) => {
      const startValid = !offer.start_date || new Date(offer.start_date) <= new Date(now)
      const endValid = !offer.end_date || new Date(offer.end_date) >= new Date(now)
      return startValid && endValid
    })

    return filtered
  } catch (error) {
    console.error('Error in getActiveOffers:', error)
    return []
  }
}

// Gallery
export async function getGalleryImages(category?: string, limit?: number) {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return []
    }

    let query = supabase
      .from('gallery_images')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      logQueryError('getGalleryImages', error, 'gallery_images')
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error in getGalleryImages:', error)
    return []
  }
}

// Static Sections
export async function getStaticSection(sectionKey: string) {
  try {
    const { data, error } = await supabase
      .from('static_sections')
      .select('*')
      .eq('section_key', sectionKey)
      .single()

    if (error) {
      console.error('Error fetching static section:', error)
      return null
    }
    return data
  } catch (error) {
    console.error('Error in getStaticSection:', error)
    return null
  }
}

// Opening Hours
export async function getOpeningHours() {
  try {
    const { data, error } = await supabase
      .from('opening_hours')
      .select('*')
      .order('weekday', { ascending: true })

    if (error) {
      console.error('Error fetching opening hours:', error)
      return []
    }
    return data || []
  } catch (error) {
    console.error('Error in getOpeningHours:', error)
    return []
  }
}

// Special Hours - Get active special hours for a date (regardless of is_open status)
export async function getSpecialHoursForDate(date: string) {
  try {
    if (!supabase) {
      console.error('[getSpecialHoursForDate] Supabase client not initialized')
      return null
    }

    console.log('[getSpecialHoursForDate] Fetching special hours for date:', date)

    const { data, error } = await supabase
      .from('special_hours')
      .select(`
        *,
        special_hours_seatings (*),
        special_hours_limits (*),
        special_hours_payment (*),
        special_hours_fields (*)
      `)
      .eq('date', date)
      .eq('status', 'active')
      .maybeSingle() // Use maybeSingle instead of single to avoid errors

    if (error) {
      console.error('[getSpecialHoursForDate] Query error:', error)
      logQueryError('getSpecialHoursForDate', error, 'special_hours')
      return null
    }

    if (!data) {
      console.log('[getSpecialHoursForDate] No special hours found for date:', date)
      return null
    }

    console.log('[getSpecialHoursForDate] Found special hours:', {
      id: data.id,
      title: data.title,
      is_open: data.is_open,
      time_from: data.time_from,
      time_to: data.time_to,
      seatings_count: data.special_hours_seatings?.length || 0
    })

    return data
  } catch (error) {
    console.error('[getSpecialHoursForDate] Exception:', error)
    return null
  }
}

// Get available time slots for a date
export async function getAvailableTimeSlots(date: string, guestCount: number = 2) {
  try {
    console.log('[getAvailableTimeSlots] Fetching slots for date:', date)
    
    // Check for events on this date
    const events = await getEventsForDate(date)
    console.log('[getAvailableTimeSlots] Events found:', events.length)
    
    const specialHours = await getSpecialHoursForDate(date)
    console.log('[getAvailableTimeSlots] Special hours found:', specialHours ? 'Yes' : 'No')
    
    if (specialHours) {
      console.log('[getAvailableTimeSlots] Special hours data:', {
        id: specialHours.id,
        title: specialHours.title,
        is_open: specialHours.is_open,
        time_from: specialHours.time_from,
        time_to: specialHours.time_to,
        has_seatings: !!specialHours.special_hours_seatings?.[0],
        seatings_data: specialHours.special_hours_seatings
      })
      
      // Check if restaurant is open for special hours
      if (!specialHours.is_open) {
        console.log('[getAvailableTimeSlots] Restaurant is closed for special hours')
        return []
      }
      
      console.log('[getAvailableTimeSlots] Restaurant is OPEN for special hours - generating slots')

      // Use special hours - restaurant is open
      // Handle both array and single object formats
      let seatings = null
      if (Array.isArray(specialHours.special_hours_seatings)) {
        seatings = specialHours.special_hours_seatings[0]
      } else if (specialHours.special_hours_seatings) {
        seatings = specialHours.special_hours_seatings
      }
      
      const intervalMinutes = seatings?.interval_minutes || 30
      console.log('[getAvailableTimeSlots] Using interval:', intervalMinutes, 'minutes')
      console.log('[getAvailableTimeSlots] Seatings config:', seatings)
      
      // If no time range specified, use all day (generate slots for common hours)
      if (!specialHours.time_from || !specialHours.time_to || specialHours.time_from === '' || specialHours.time_to === '') {
        console.log('[getAvailableTimeSlots] No time range specified, using default 11 AM - 11 PM')
        const slots: string[] = []
        
        for (let hour = 11; hour < 23; hour++) {
          for (let min = 0; min < 60; min += intervalMinutes) {
            slots.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
          }
        }
        console.log('[getAvailableTimeSlots] Generated', slots.length, 'slots (default range)')
        return slots
      }

      const slots: string[] = []
      
      // Parse time strings - handle both "HH:MM" and "HH:MM:SS" formats
      const parseTime = (timeStr: string) => {
        const parts = timeStr.split(':')
        return {
          hour: parseInt(parts[0]) || 0,
          minute: parseInt(parts[1]) || 0
        }
      }
      
      const startTime = parseTime(specialHours.time_from)
      const endTime = parseTime(specialHours.time_to)
      
      console.log('[getAvailableTimeSlots] Time range:', {
        start: `${startTime.hour}:${startTime.minute}`,
        end: `${endTime.hour}:${endTime.minute}`,
        interval: intervalMinutes,
        startRaw: specialHours.time_from,
        endRaw: specialHours.time_to
      })
      
      // Validate parsed times
      if (isNaN(startTime.hour) || isNaN(startTime.minute) || isNaN(endTime.hour) || isNaN(endTime.minute)) {
        console.error('[getAvailableTimeSlots] Invalid time format, using defaults')
        // Fallback to default hours
        for (let hour = 11; hour < 23; hour++) {
          for (let min = 0; min < 60; min += intervalMinutes) {
            slots.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
          }
        }
        return slots
      }
      
      let currentHour = startTime.hour
      let currentMin = startTime.minute
      
      // Generate slots until we reach or pass the end time
      let iterations = 0
      const maxIterations = 200 // Safety limit (increased for longer hours)
      
      while (iterations < maxIterations) {
        // Check if we've passed the end time
        if (currentHour > endTime.hour || (currentHour === endTime.hour && currentMin >= endTime.minute)) {
          break
        }
        
        const timeSlot = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`
        slots.push(timeSlot)
        
        // Increment by interval
        currentMin += intervalMinutes
        if (currentMin >= 60) {
          currentMin = currentMin % 60
          currentHour++
        }
        
        iterations++
      }
      
      if (slots.length === 0) {
        console.warn('[getAvailableTimeSlots] No slots generated! Check time range:', {
          start: specialHours.time_from,
          end: specialHours.time_to,
          parsedStart: startTime,
          parsedEnd: endTime
        })
      }
      
      console.log('[getAvailableTimeSlots] Generated', slots.length, 'slots for special hours')
      if (slots.length > 0) {
        console.log('[getAvailableTimeSlots] First 3 slots:', slots.slice(0, 3))
        console.log('[getAvailableTimeSlots] Last 3 slots:', slots.slice(-3))
      }
      
      // Filter out slots that conflict with events (with 2-hour buffer)
      if (events.length > 0) {
        const filteredSlots = slots.filter(slot => !isTimeSlotBlockedByEvent(date, slot, events, 120))
        console.log('[getAvailableTimeSlots] Filtered out', slots.length - filteredSlots.length, 'slots due to event conflicts')
        return filteredSlots
      }
      
      return slots
    } else {
      // No special hours - use regular opening hours
      console.log('[getAvailableTimeSlots] No special hours, using regular hours')
      const openingHours = await getOpeningHours()
      const dayOfWeek = new Date(date).getDay()
      const hours = openingHours.find(h => h.weekday === dayOfWeek)
      
      console.log('[getAvailableTimeSlots] Regular hours for weekday', dayOfWeek, ':', hours)
      
      if (!hours || hours.is_closed) {
        console.log('[getAvailableTimeSlots] Regular hours: closed')
        return []
      }

      const slots: string[] = []
      const [openHour, openMin] = hours.open_time.split(':').map(Number)
      const [closeHour, closeMin] = hours.close_time.split(':').map(Number)
      
      console.log('[getAvailableTimeSlots] Regular hours range:', {
        open: `${openHour}:${openMin}`,
        close: `${closeHour}:${closeMin}`
      })
      
      let currentHour = openHour
      let currentMin = openMin
      
      while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
        slots.push(`${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`)
        currentMin += 30
        if (currentMin >= 60) {
          currentMin = 0
          currentHour++
        }
      }
      
      console.log('[getAvailableTimeSlots] Generated', slots.length, 'slots for regular hours')
      
      // Filter out slots that conflict with events (with 2-hour buffer)
      if (events.length > 0) {
        const filteredSlots = slots.filter(slot => !isTimeSlotBlockedByEvent(date, slot, events, 120))
        console.log('[getAvailableTimeSlots] Filtered out', slots.length - filteredSlots.length, 'slots due to event conflicts')
        return filteredSlots
      }
      
      return slots
    }
  } catch (error) {
    console.error('[getAvailableTimeSlots] Error:', error)
    return []
  }
}

// Site Settings
export async function getSiteSetting(key: string) {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('key', key)
    .single()

  if (error) {
    console.error('Error fetching site setting:', error)
    return null
  }
  return data
}

