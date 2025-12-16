'use client'

import { useState, useMemo, useEffect } from 'react'
import { format, parseISO, getYear, getMonth } from 'date-fns'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, ArrowRight, Ticket } from 'lucide-react'
import SupabaseImage from '@/components/SupabaseImage'
import AnimatedSection from '@/components/AnimatedSection'
import { formatFloridaTime, toFloridaTime, getFloridaNow, isEventActive } from '@/lib/utils/timezone'

interface Event {
  id: string
  title: string
  description?: string
  event_start: string
  event_end?: string
  location?: string
  image_path?: string
  slug: string
  base_ticket_price?: number | string
  ticket_currency?: string
  event_tickets?: Array<{ price: number | string }>
}

interface EventsTimelineProps {
  events: Event[]
}

export default function EventsTimeline({ events }: EventsTimelineProps) {
  // Filter only active events (events that haven't ended yet)
  // - If event has event_end: event is visible until event_end time
  // - If no event_end: event is visible for the whole day of event_start
  // - Event should not appear if it has already ended
  const upcomingEvents = useMemo(() => {
    const filtered = events.filter((event) => {
      const isActive = isEventActive(event)
      
      if (!isActive) {
        const eventEnd = event.event_end 
          ? (typeof event.event_end === 'string' ? parseISO(event.event_end) : event.event_end)
          : null
        const eventStart = typeof event.event_start === 'string' ? parseISO(event.event_start) : event.event_start
        console.log(`[EventsTimeline] Filtered out ended event: ${event.title}`, {
          start: eventStart,
          end: eventEnd || 'whole day',
          now: getFloridaNow()
        })
      }
      
      return isActive
    })
    
    console.log(`[EventsTimeline] Total events: ${events.length}, Upcoming events: ${filtered.length}`)
    console.log(`[EventsTimeline] Upcoming events by year:`, 
      filtered.reduce((acc, e) => {
        const year = new Date(e.event_start).getFullYear().toString()
        acc[year] = (acc[year] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    )
    console.log(`[EventsTimeline] Upcoming events details:`, 
      filtered.map(e => ({
        title: e.title,
        date: e.event_start,
        parsedDate: typeof e.event_start === 'string' ? parseISO(e.event_start) : new Date(e.event_start),
        year: new Date(e.event_start).getFullYear(),
        month: new Date(e.event_start).getMonth()
      }))
    )
    return filtered
  }, [events])

  // Helper function to extract year and month from date string
  // This avoids timezone conversion issues by working with the date string directly
  // IMPORTANT: Extract from the date part only (YYYY-MM-DD), ignore time and timezone
  const getYearMonthFromDate = (dateStr: string | Date): { year: number; month: number } | null => {
    try {
      let str: string
      if (typeof dateStr === 'string') {
        str = dateStr
      } else {
        // If it's a Date object, get the ISO string
        str = dateStr.toISOString()
      }
      
      // Extract date part from various formats:
      // "2025-12-15T10:00:00Z" -> "2025-12-15"
      // "2025-12-15T10:00:00.000Z" -> "2025-12-15"
      // "2025-12-15" -> "2025-12-15"
      const datePartMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (datePartMatch) {
        const year = parseInt(datePartMatch[1], 10)
        const month = parseInt(datePartMatch[2], 10) - 1 // Convert to 0-based (0 = January, 11 = December)
        
        // Validate: month should be 0-11
        if (month < 0 || month > 11) {
          console.error(`Invalid month extracted: ${month} from date string: ${str}`)
          return null
        }
        
        return { year, month }
      }
      
      console.error(`Could not extract date parts from: ${str}`)
      return null
    } catch (error) {
      console.error('Error extracting year/month from date:', error, dateStr)
      return null
    }
  }

  // Group events by year-month combination (e.g., "2025-11" for December 2025, "2026-0" for January 2026)
  // This allows us to show all months from all years in chronological order
  // Only months that have events will be included
  const eventsByYearMonth = useMemo(() => {
    const grouped: Record<string, Event[]> = {}
    
    console.log(`[EventsTimeline] Total events received: ${events.length}`)
    console.log(`[EventsTimeline] Upcoming events to group: ${upcomingEvents.length}`)
    
    // Group all upcoming events by their year-month
    // IMPORTANT: Extract year/month from the date string directly to avoid timezone conversion issues
    upcomingEvents.forEach((event) => {
      try {
        if (!event.event_start) {
          console.warn(`[EventsTimeline] Event "${event.title}" has no event_start, skipping`)
          return
        }
        
        // Extract year and month directly from the date string (YYYY-MM-DD part only)
        // This is the most reliable way - extract from the string itself, no parsing/conversion
        let dateStr: string
        if (typeof event.event_start === 'string') {
          dateStr = event.event_start
        } else {
          // Type assertion for Date or convert to string
          const dateValue = event.event_start as any
          dateStr = dateValue instanceof Date ? dateValue.toISOString() : String(event.event_start)
        }
        
        // Extract YYYY-MM-DD from the date string
        const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
        if (!dateMatch) {
          console.warn(`[EventsTimeline] Could not extract date from "${event.title}": ${dateStr}`)
          return
        }
        
        const year = parseInt(dateMatch[1], 10)
        const monthNum = parseInt(dateMatch[2], 10) // 1-12 (1 = January, 12 = December)
        const month = monthNum - 1 // Convert to 0-based (0 = January, 11 = December)
        
        // Validate month
        if (month < 0 || month > 11) {
          console.error(`[EventsTimeline] Invalid month ${month} (from ${monthNum}) for event "${event.title}": ${dateStr}`)
          return
        }
        
        // Create a unique key combining year and month (e.g., "2025-11" for December 2025, "2026-0" for January 2026)
        const key = `${year}-${month}`
        
        // For logging, show the month name
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        const monthName = monthNames[month]
        
        console.log(`[EventsTimeline] Event "${event.title}": date=${dateStr}, extracted monthNum=${monthNum}, monthIndex=${month} (${monthName} ${year}), key=${key}`)
        
        // Initialize array for this month if it doesn't exist
        if (!grouped[key]) {
          grouped[key] = []
        }
        
        grouped[key].push(event)
      } catch (error) {
        console.error(`[EventsTimeline] Error parsing event date for "${event.title}":`, error, event)
      }
    })
    
    // Sort events within each month by date (earliest first)
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => {
        const dateA = typeof a.event_start === 'string' ? parseISO(a.event_start) : new Date(a.event_start)
        const dateB = typeof b.event_start === 'string' ? parseISO(b.event_start) : new Date(b.event_start)
        return dateA.getTime() - dateB.getTime()
      })
    })
    
    // Month names for logging
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    
    console.log(`[EventsTimeline] Grouped into ${Object.keys(grouped).length} unique month-year combinations`)
    console.log(`[EventsTimeline] Events per month:`, Object.entries(grouped).map(([key, events]) => {
      const [yearStr, monthStr] = key.split('-')
      const year = parseInt(yearStr)
      const month = parseInt(monthStr)
      const monthName = monthNames[month] || `Month ${month}`
      return `${monthName} ${year} (key: ${key}): ${events.length} event(s)`
    }))
    
    return grouped
  }, [upcomingEvents, events.length])

  // Get all months from all years, sorted chronologically
  // Determine if we need to show years (if events span multiple years)
  const allMonths = useMemo(() => {
    const months: Array<{
      key: string
      year: number
      month: number
      label: string
      fullLabel: string
      count: number
    }> = []
    
    // Get all unique years from events
    const years = new Set<number>()
    Object.keys(eventsByYearMonth).forEach((key) => {
      const [yearStr] = key.split('-')
      years.add(parseInt(yearStr))
    })
    
    // Check if events span multiple years
    const hasMultipleYears = years.size > 1
    const currentYear = new Date().getFullYear()
    
    // Month names arrays for direct mapping (avoid timezone conversion issues)
    const monthNamesFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    Object.keys(eventsByYearMonth).forEach((key) => {
      const [yearStr, monthStr] = key.split('-')
      const year = parseInt(yearStr)
      const month = parseInt(monthStr) // This is 0-based (0 = January, 11 = December)
      
      // Validate month index
      if (month < 0 || month > 11) {
        console.error(`[EventsTimeline] Invalid month index ${month} for key ${key}`)
        return
      }
      
      // Use direct month name mapping to avoid timezone conversion issues
      const monthNameFull = monthNamesFull[month]
      const monthNameShort = monthNamesShort[month]
      
      // Generate label based on whether we have multiple years
      let label: string
      if (hasMultipleYears) {
        // Show month + year abbreviation (e.g., "Jan '26", "Dec '25")
        label = `${monthNameShort} '${year.toString().slice(-2)}`
      } else {
        // Show month only (e.g., "Jan", "Feb")
        label = monthNameShort
      }
      
      months.push({
        key,
        year,
        month,
        label,
        fullLabel: `${monthNameFull} ${year}`, // "January 2025", "January 2026"
        count: eventsByYearMonth[key].length
      })
    })
    
    // Sort chronologically (by year, then by month)
    months.sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year
      }
      return a.month - b.month
    })
    
    console.log(`[EventsTimeline] All months with events:`, months.map(m => `${m.label} (${m.count} events)`))
    console.log(`[EventsTimeline] Has multiple years: ${hasMultipleYears}, Years:`, Array.from(years))
    
    return months
  }, [eventsByYearMonth])

  // Get initial selected month (first upcoming month with events)
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null)
  
  // Set initial selected month when months are available
  useEffect(() => {
    if (allMonths.length > 0) {
      // Always select the first month (chronologically first upcoming month)
      if (selectedMonthKey === null || !allMonths.find(m => m.key === selectedMonthKey)) {
        setSelectedMonthKey(allMonths[0].key)
      }
    } else {
      setSelectedMonthKey(null)
    }
  }, [allMonths])

  // Get events for selected month
  const currentEvents = useMemo(() => {
    if (!selectedMonthKey) return []
    return eventsByYearMonth[selectedMonthKey] || []
  }, [selectedMonthKey, eventsByYearMonth])
  
  // Get selected month info
  const selectedMonthInfo = useMemo(() => {
    return allMonths.find(m => m.key === selectedMonthKey)
  }, [allMonths, selectedMonthKey])

  // Handle month toggle with smooth scroll
  const handleMonthToggle = (monthKey: string) => {
    setSelectedMonthKey(monthKey)
    // Smooth scroll to events section
    setTimeout(() => {
      const eventsSection = document.getElementById('events-list')
      if (eventsSection) {
        eventsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return ''
    try {
      return formatFloridaTime(timeString, 'h:mm a')
    } catch {
      return timeString
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString)
      return {
        weekday: formatFloridaTime(date, 'EEE'),
        day: formatFloridaTime(date, 'd'),
        month: formatFloridaTime(date, 'MMM'),
        full: formatFloridaTime(date, 'MMMM d, yyyy')
      }
    } catch {
      return {
        weekday: '',
        day: '',
        month: '',
        full: ''
      }
    }
  }

  if (upcomingEvents.length === 0) {
    return (
      <div className="text-center py-16 md:py-20">
        <div className="card-dark max-w-md mx-auto">
          <Calendar className="h-14 w-14 md:h-16 md:w-16 text-[#F59E0B] mx-auto mb-4 opacity-60" />
          <p className="body-text text-center">No upcoming events scheduled at the moment. Check back soon!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Heading */}
      <AnimatedSection direction="down">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="section-title mb-2">
            UPCOMING EVENTS
          </h2>
          <div className="w-16 md:w-28 h-0.5 md:h-1 bg-[#F59E0B] mx-auto rounded-full"></div>
        </div>
      </AnimatedSection>

      {/* Month Selector Toggle Buttons - Only months with events */}
      {allMonths.length > 0 && (
        <AnimatedSection direction="up" delay={100}>
          <div className="mb-6 md:mb-8">
            {/* Mobile: Horizontal scrollable */}
            <div className="md:hidden overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4">
              <div className="flex gap-2 min-w-max">
                {allMonths.map((month) => (
                  <button
                    key={month.key}
                    onClick={() => handleMonthToggle(month.key)}
                    className={`relative px-3.5 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all duration-300 flex-shrink-0 ${
                      selectedMonthKey === month.key
                        ? 'bg-[#F59E0B] text-black scale-105 shadow-lg shadow-[#F59E0B]/30 z-10'
                        : 'bg-[#111111] border-2 border-white/10 text-[#D1D5DB] active:bg-[#F59E0B]/15 active:border-[#F59E0B]/50 active:text-[#F59E0B]'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{month.label}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        selectedMonthKey === month.key
                          ? 'bg-white/20 text-white'
                          : 'bg-[#F59E0B]/20 text-[#F59E0B]'
                      }`}>
                        {month.count}
                      </span>
                    </span>
                    {selectedMonthKey === month.key && (
                      <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-[#F59E0B] rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Desktop: Centered wrap */}
            <div className="hidden md:flex flex-wrap gap-2.5 md:gap-3 justify-center">
              {allMonths.map((month) => (
                <button
                  key={month.key}
                  onClick={() => handleMonthToggle(month.key)}
                  className={`relative px-5 md:px-7 py-2.5 md:py-3.5 rounded-xl font-bold text-sm md:text-base whitespace-nowrap transition-all duration-300 transform ${
                    selectedMonthKey === month.key
                      ? 'bg-[#F59E0B] text-black scale-105 shadow-lg shadow-[#F59E0B]/30 z-10'
                      : 'bg-[#111111] border-2 border-white/10 text-[#D1D5DB] hover:bg-[#F59E0B]/15 hover:border-[#F59E0B]/50 hover:text-[#F59E0B] hover:scale-102 active:scale-95'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{month.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      selectedMonthKey === month.key
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-500/20 text-[#F59E0B]'
                    }`}>
                      {month.count}
                    </span>
                  </span>
                  {selectedMonthKey === month.key && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-[#F59E0B] rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* Month Section */}
      {selectedMonthKey && currentEvents.length > 0 && (
        <AnimatedSection direction="up" delay={200}>
          <div id="events-list" className="mb-6 md:mb-8 scroll-mt-20">
            <h3 className="text-lg md:text-display-3 font-bold text-white mb-5 md:mb-8">
              {selectedMonthInfo?.fullLabel || 'Events'}
            </h3>

            {/* Events List */}
            <div className="space-y-0">
              {currentEvents.map((event, index) => {
                const eventDate = formatDate(event.event_start)
                            const eventEnd = event.event_end
                              ? (typeof event.event_end === 'string' ? toFloridaTime(parseISO(event.event_end)) : toFloridaTime(event.event_end))
                              : null
                            const eventStart = typeof event.event_start === 'string'
                              ? toFloridaTime(parseISO(event.event_start))
                              : toFloridaTime(event.event_start)

                return (
                  <div
                    key={event.id}
                    className={`event-item-card border-b border-white/10 last:border-b-0 ${
                      index > 0 ? 'pt-5 md:pt-8' : ''
                    } ${index < currentEvents.length - 1 ? 'pb-5 md:pb-8' : ''}`}
                  >
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-4">
                      {/* Date and Image Row */}
                      <div className="flex gap-3 items-start">
                        {/* Date Block */}
                        <div className="card-dark p-3 text-center flex-shrink-0 border border-[#F59E0B]/20">
                          <div className="text-[10px] font-semibold text-[#F59E0B] uppercase tracking-wider mb-0.5">
                            {eventDate.weekday}
                          </div>
                          <div className="text-xl font-extrabold text-[#F59E0B] mb-0.5">
                            {eventDate.day}
                          </div>
                          <div className="text-[10px] font-medium text-gray-400 uppercase">
                            {eventDate.month}
                          </div>
                        </div>
                        
                        {/* Event Image */}
                        <Link href={`/events/${encodeURIComponent(event.slug)}`} className="flex-1">
                          <div className="relative aspect-[16/10] rounded-lg overflow-hidden card-dark group border border-white/10">
                            {event.image_path ? (
                              <SupabaseImage
                                src={event.image_path}
                                alt={event.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                bucket="events"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-600/40 via-purple-600/40 to-blue-600/40 flex items-center justify-center">
                                <Calendar className="h-8 w-8 text-[#F59E0B] opacity-50" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          </div>
                        </Link>
                      </div>

                      {/* Content */}
                      <div className="space-y-3">
                        {/* Show Time */}
                        <div className="flex items-center gap-2">
                          <div className="bg-gradient-to-br from-[#F59E0B]/12 to-[#F59E0B]/6 rounded-lg p-1 border border-[#F59E0B]/20">
                            <Clock className="h-3.5 w-3.5 text-[#F59E0B]" />
                          </div>
                          <span className="text-xs font-semibold text-[#F59E0B]">
                            {formatTime(event.event_start)}
                            {eventEnd && ` - ${formatTime(event.event_end)}`}
                          </span>
                        </div>

                        {/* Event Title */}
                        <h4 className="card-title">
                          {event.title}
                        </h4>

                        {/* Description */}
                        {event.description && (
                          <p className="body-text text-sm line-clamp-2">
                            {event.description}
                          </p>
                        )}

                        {/* Location and Ticket Price Row */}
                        <div className="flex flex-col gap-2">
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 text-gray-400" />
                              <span className="text-xs body-text">{event.location}</span>
                            </div>
                          )}

                          {(event.base_ticket_price || (event.event_tickets && event.event_tickets.length > 0)) && (
                            <div className="flex items-center gap-2">
                              <Ticket className="h-3.5 w-3.5 text-[#F59E0B]" />
                              <span className="text-xs font-semibold price-amber">
                                {event.base_ticket_price 
                                  ? `${event.ticket_currency === 'USD' ? '$' : event.ticket_currency === 'EUR' ? '€' : event.ticket_currency === 'GBP' ? '£' : event.ticket_currency === 'CAD' ? 'C$' : event.ticket_currency === 'AUD' ? 'A$' : '$'}${parseFloat(event.base_ticket_price.toString()).toFixed(2)}`
                                  : event.event_tickets && event.event_tickets.length > 0
                                    ? `From $${parseFloat(event.event_tickets[0].price.toString()).toFixed(2)}`
                                    : ''
                                }
                              </span>
                            </div>
                          )}
                        </div>

                        {/* CTA Button */}
                        <Link href={`/events/${encodeURIComponent(event.slug)}`} className="block">
                          <button className="btn-amber-sm w-full">
                            View Details <ArrowRight className="ml-2 h-3.5 w-3.5 inline" />
                          </button>
                        </Link>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:grid grid-cols-12 gap-4 md:gap-6 items-start max-w-5xl mx-auto">
                      {/* Date Block - Left */}
                      <div className="lg:col-span-2">
                        <div className="card-dark p-4 md:p-5 text-center border border-[#F59E0B]/20">
                          <div className="text-xs md:text-sm font-semibold text-[#F59E0B] uppercase tracking-wider mb-1">
                            {eventDate.weekday}
                          </div>
                          <div className="text-2xl md:text-3xl font-extrabold text-[#F59E0B] mb-1">
                            {eventDate.day}
                          </div>
                          <div className="text-xs md:text-sm font-medium text-gray-400 uppercase">
                            {eventDate.month}
                          </div>
                        </div>
                      </div>

                      {/* Content Area - Center */}
                      <div className="lg:col-span-7 flex flex-col justify-between">
                        <div>
                          {/* Show Time */}
                          <div className="flex items-center gap-2 mb-3">
                            <div className="bg-gradient-to-br from-[#F59E0B]/12 to-[#F59E0B]/6 rounded-lg p-1.5 border border-[#F59E0B]/20">
                              <Clock className="h-4 w-4 text-[#F59E0B]" />
                            </div>
                            <span className="text-body-small font-semibold text-[#F59E0B]">
                              {formatTime(event.event_start)}
                              {eventEnd && ` - ${formatTime(event.event_end)}`}
                            </span>
                          </div>

                          {/* Event Title */}
                          <h4 className="card-title mb-3 md:mb-4">
                            {event.title}
                          </h4>

                          {/* Description */}
                          {event.description && (
                            <p className="body-text text-sm mb-4 md:mb-5 line-clamp-2">
                              {event.description}
                            </p>
                          )}

                          {/* Location */}
                          {event.location && (
                            <div className="flex items-center gap-2 mb-4">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="text-sm body-text">{event.location}</span>
                            </div>
                          )}

                          {/* Ticket Price */}
                          {(event.base_ticket_price || (event.event_tickets && event.event_tickets.length > 0)) && (
                            <div className="flex items-center gap-2 mb-4">
                              <Ticket className="h-4 w-4 text-[#F59E0B]" />
                              <span className="text-sm font-semibold price-amber">
                                {event.base_ticket_price 
                                  ? `${event.ticket_currency === 'USD' ? '$' : event.ticket_currency === 'EUR' ? '€' : event.ticket_currency === 'GBP' ? '£' : event.ticket_currency === 'CAD' ? 'C$' : event.ticket_currency === 'AUD' ? 'A$' : '$'}${parseFloat(event.base_ticket_price.toString()).toFixed(2)}`
                                  : event.event_tickets && event.event_tickets.length > 0
                                    ? `From $${parseFloat(event.event_tickets[0].price.toString()).toFixed(2)}`
                                    : ''
                                }
                              </span>
                            </div>
                          )}
                        </div>

                        {/* CTA Button */}
                        <div className="mt-4">
                          <Link href={`/events/${encodeURIComponent(event.slug)}`}>
                            <button className="btn-amber-sm inline-flex items-center gap-2">
                              View Details <ArrowRight className="h-4 w-4" />
                            </button>
                          </Link>
                        </div>
                      </div>

                      {/* Event Image - Right */}
                      <div className="lg:col-span-3">
                        <Link href={`/events/${encodeURIComponent(event.slug)}`}>
                          <div className="relative aspect-[4/5] rounded-xl overflow-hidden card-dark group cursor-pointer border border-white/10">
                            {event.image_path ? (
                              <SupabaseImage
                                src={event.image_path}
                                alt={event.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                bucket="events"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-600/40 via-purple-600/40 to-blue-600/40 flex items-center justify-center">
                                <Calendar className="h-12 w-12 text-[#F59E0B] opacity-50" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* Empty State for Selected Month */}
      {selectedMonthKey && currentEvents.length === 0 && (
        <div className="text-center py-12 md:py-16">
          <div className="card-dark max-w-md mx-auto">
            <Calendar className="h-12 w-12 md:h-14 md:w-14 text-[#F59E0B] mx-auto mb-4 opacity-60" />
            <p className="body-text text-center">
              No events scheduled for {selectedMonthInfo?.fullLabel || 'this month'}.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
