'use client'

import { useState, useMemo, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import { Calendar, Clock, MapPin, ArrowRight, Ticket } from 'lucide-react'
import SupabaseImage from '@/components/SupabaseImage'
import AnimatedSection from '@/components/AnimatedSection'
import { formatFloridaTime, toFloridaTime, getFloridaNow, formatFloridaDateDDMMYYYY } from '@/lib/utils/timezone'

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
  // Filter and sort events - only show future/upcoming events (using Florida timezone)
  const sortedEvents = useMemo(() => {
    const now = getFloridaNow()
    
    // Filter out past events
    const upcomingEvents = events.filter((event) => {
      try {
        const eventStart = typeof event.event_start === 'string' ? parseISO(event.event_start) : new Date(event.event_start)
        const floridaEventStart = toFloridaTime(eventStart)
        
        // If event has an end time, check if it has ended
        if (event.event_end) {
          const eventEnd = typeof event.event_end === 'string' ? parseISO(event.event_end) : new Date(event.event_end)
          const floridaEventEnd = toFloridaTime(eventEnd)
          // Show event if current time is before event end
          return now < floridaEventEnd
        }
        
        // If no end time, show event if it's today or in the future
        // Set to end of event start day (23:59:59.999) for comparison
        const eventStartDayEnd = new Date(floridaEventStart)
        eventStartDayEnd.setHours(23, 59, 59, 999)
        return now <= eventStartDayEnd
      } catch (error) {
        console.error('Error filtering event:', error, event)
        return false
      }
    })
    
    // Sort by date
    return upcomingEvents.sort((a, b) => {
      const dateA = typeof a.event_start === 'string' ? parseISO(a.event_start) : new Date(a.event_start)
      const dateB = typeof b.event_start === 'string' ? parseISO(b.event_start) : new Date(b.event_start)
      const floridaDateA = toFloridaTime(dateA)
      const floridaDateB = toFloridaTime(dateB)
      return floridaDateA.getTime() - floridaDateB.getTime()
    })
  }, [events])

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
      // Parse the date and convert to Florida timezone
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString)
      const floridaDate = toFloridaTime(date)
      
      return {
        weekday: formatFloridaTime(floridaDate, 'EEE'),
        day: formatFloridaTime(floridaDate, 'd'),
        month: formatFloridaTime(floridaDate, 'MMM'),
        monthNum: floridaDate.getMonth(), // 0-11 (in Florida timezone)
        full: formatFloridaDateDDMMYYYY(date), // Use dd-mm-yyyy format
        year: formatFloridaTime(floridaDate, 'yyyy')
      }
    } catch {
      return {
        weekday: '',
        day: '',
        month: '',
        monthNum: 0,
        full: '',
        year: ''
      }
    }
  }

  // Group events by year-month for month selector (using Florida timezone)
  const eventsByYearMonth = useMemo(() => {
    const grouped: Record<string, { year: number; month: number; monthName: string; events: Event[] }> = {}
    
    sortedEvents.forEach((event) => {
      try {
        // Parse and convert to Florida timezone
        const date = typeof event.event_start === 'string' ? parseISO(event.event_start) : new Date(event.event_start)
        const floridaDate = toFloridaTime(date)
        const year = floridaDate.getFullYear()
        const month = floridaDate.getMonth() // 0-11 (in Florida timezone)
        const key = `${year}-${month.toString().padStart(2, '0')}`
        
        if (!grouped[key]) {
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
          grouped[key] = {
            year,
            month,
            monthName: monthNames[month],
            events: []
          }
        }
        grouped[key].events.push(event)
      } catch (error) {
        console.error('Error grouping event by month:', error, event)
      }
    })
    
    return grouped
  }, [sortedEvents])

  // Get all available months sorted chronologically
  const availableMonths = useMemo(() => {
    return Object.entries(eventsByYearMonth)
      .sort(([keyA], [keyB]) => {
        const [yearA, monthA] = keyA.split('-').map(Number)
        const [yearB, monthB] = keyB.split('-').map(Number)
        if (yearA !== yearB) return yearA - yearB
        return monthA - monthB
      })
      .map(([key, data]) => ({
        key,
        ...data
      }))
  }, [eventsByYearMonth])

  // Selected month state
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)

  // Get events for selected month
  const currentMonthEvents = useMemo(() => {
    if (!selectedMonthKey) return []
    return eventsByYearMonth[selectedMonthKey]?.events || []
  }, [selectedMonthKey, eventsByYearMonth])

  // Restore selected month from sessionStorage on mount
  useEffect(() => {
    if (availableMonths.length > 0 && Object.keys(eventsByYearMonth).length > 0) {
      const savedMonthKey = sessionStorage.getItem('events-selected-month')
      
      // Restore selected month if it exists and is valid
      if (savedMonthKey && eventsByYearMonth[savedMonthKey]) {
        setIsRestoring(true)
        setSelectedMonthKey(savedMonthKey)
      } else if (selectedMonthKey === null) {
        // Default to first available month if no saved state
        setSelectedMonthKey(availableMonths[0].key)
      }
    }
  }, [availableMonths.length, eventsByYearMonth, selectedMonthKey, availableMonths])

  // Restore scroll position after selected month is set and events are rendered
  useEffect(() => {
    if (selectedMonthKey && currentMonthEvents.length > 0) {
      const savedScrollY = sessionStorage.getItem('events-scroll-y')
      if (savedScrollY && isRestoring) {
        // Use requestAnimationFrame to ensure DOM is fully rendered
        requestAnimationFrame(() => {
          setTimeout(() => {
            window.scrollTo({
              top: parseInt(savedScrollY, 10),
              behavior: 'instant'
            })
            sessionStorage.removeItem('events-scroll-y')
            setIsRestoring(false)
          }, 50)
        })
      } else if (!savedScrollY && isRestoring) {
        setIsRestoring(false)
      }
    }
  }, [selectedMonthKey, currentMonthEvents.length, isRestoring])

  // Save selected month to sessionStorage whenever it changes (but not during restoration)
  useEffect(() => {
    if (selectedMonthKey && !isRestoring) {
      sessionStorage.setItem('events-selected-month', selectedMonthKey)
    }
  }, [selectedMonthKey, isRestoring])

  // Save scroll position and selected month when clicking on event links
  useEffect(() => {
    const handleEventLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a[href^="/events/"]') as HTMLAnchorElement
      if (link && link.href.includes('/events/') && !link.href.endsWith('/events')) {
        sessionStorage.setItem('events-scroll-y', window.scrollY.toString())
        if (selectedMonthKey) {
          sessionStorage.setItem('events-selected-month', selectedMonthKey)
        }
      }
    }

    document.addEventListener('click', handleEventLinkClick, true)
    return () => {
      document.removeEventListener('click', handleEventLinkClick, true)
    }
  }, [selectedMonthKey])

  // Get selected month info
  const selectedMonthInfo = useMemo(() => {
    if (!selectedMonthKey) return null
    return eventsByYearMonth[selectedMonthKey] || null
  }, [selectedMonthKey, eventsByYearMonth])

  // Handle month toggle with smooth scroll
  const handleMonthToggle = (monthKey: string) => {
    setSelectedMonthKey(monthKey)
    // Smooth scroll to timeline
    setTimeout(() => {
      const timelineSection = document.getElementById('events-timeline')
      if (timelineSection) {
        timelineSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  if (sortedEvents.length === 0) {
    return (
      <div className="text-center py-16 md:py-20">
        <div className="card-dark max-w-md mx-auto">
          <Calendar className="h-14 w-14 md:h-16 md:w-16 text-[#F59E0B] mx-auto mb-4 opacity-60" />
          <p className="body-text text-center">No events scheduled at the moment. Check back soon!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Heading */}
      <AnimatedSection direction="down">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="section-title mb-2">
            UPCOMING EVENTS
          </h2>
          <div className="w-16 md:w-28 h-0.5 md:h-1 bg-[#F59E0B] mx-auto rounded-full"></div>
        </div>
      </AnimatedSection>

      {/* Month Selector Buttons */}
      {availableMonths.length > 0 && (
        <AnimatedSection direction="up" delay={100}>
          <div className="mb-8 md:mb-12">
            {/* Mobile: Horizontal scrollable */}
            <div className="md:hidden overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4">
              <div className="flex gap-2 min-w-max">
                {availableMonths.map((month) => (
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
                      <span>{month.monthName.slice(0, 3)}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        selectedMonthKey === month.key
                          ? 'bg-white/20 text-white'
                          : 'bg-[#F59E0B]/20 text-[#F59E0B]'
                      }`}>
                        {month.events.length}
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
              {availableMonths.map((month) => (
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
                    <span>{month.monthName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      selectedMonthKey === month.key
                        ? 'bg-white/20 text-white'
                        : 'bg-[#F59E0B]/20 text-[#F59E0B]'
                    }`}>
                      {month.events.length}
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

      {/* Vertical Timeline for Selected Month */}
      {selectedMonthKey && currentMonthEvents.length > 0 && (
        <div id="events-timeline" className="relative scroll-mt-20">
          {/* Month Label */}
          <AnimatedSection direction="down" delay={200}>
            <div className="text-center mb-8 md:mb-12 relative z-10">
              <div className="bg-[#0E0E0E] inline-block px-6 py-3 rounded-lg border-2 border-[#F59E0B] shadow-lg">
                <h3 className="text-2xl md:text-3xl font-bold text-[#F59E0B]">
                  {selectedMonthInfo?.monthName} {selectedMonthInfo?.year}
                </h3>
                <p className="text-sm text-gray-400 mt-2">
                  {currentMonthEvents.length} {currentMonthEvents.length === 1 ? 'event' : 'events'}
                </p>
              </div>
            </div>
          </AnimatedSection>

          {/* Vertical Line - Desktop (starts below month label) */}
          <div className="hidden md:block absolute left-1/2 top-24 md:top-28 bottom-0 w-0.5 bg-gradient-to-b from-[#F59E0B] via-[#F59E0B]/60 to-[#F59E0B] transform -translate-x-1/2 z-0"></div>
          
          {/* Vertical Line - Mobile (left side, starts below month label) */}
          <div className="md:hidden absolute left-6 top-24 bottom-0 w-0.5 bg-gradient-to-b from-[#F59E0B] via-[#F59E0B]/60 to-[#F59E0B] z-0"></div>

          {/* Events List */}
          <div className="relative space-y-8 md:space-y-12">
            {currentMonthEvents.map((event, index) => {
              const eventDate = formatDate(event.event_start)
              const eventEnd = event.event_end
                ? (typeof event.event_end === 'string' ? toFloridaTime(parseISO(event.event_end)) : toFloridaTime(event.event_end))
                : null
              const eventStart = typeof event.event_start === 'string'
                ? toFloridaTime(parseISO(event.event_start))
                : toFloridaTime(event.event_start)
              
              // Debug logging for first event
              if (index === 0) {
                console.log('EventsTimeline - Event display:', {
                  'Raw from DB': event.event_start,
                  'Florida time (start)': formatFloridaTime(eventStart, 'yyyy-MM-dd HH:mm:ss'),
                  'Display time': formatTime(event.event_start),
                })
              }

              // Alternate left/right for desktop
              const isEven = index % 2 === 0

              return (
                <AnimatedSection 
                  key={event.id} 
                  direction={isEven ? 'left' : 'right'} 
                  delay={index * 0.1}
                  className="relative"
                >
                  {/* Timeline Node/Dot */}
                  <div className="absolute left-6 md:left-1/2 transform -translate-x-1/2 z-20">
                    <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-[#F59E0B] border-4 border-[#0E0E0E] shadow-lg shadow-[#F59E0B]/50"></div>
                    <div className="absolute inset-0 w-4 h-4 md:w-5 md:h-5 rounded-full bg-[#F59E0B] animate-ping opacity-20"></div>
                  </div>

                  {/* Event Card with 3D Effect */}
                  <div className={`ml-16 md:ml-0 ${isEven ? 'md:mr-[55%]' : 'md:ml-[55%]'} card-3d`}>
                    <div className="card-dark hover:border-[#F59E0B]/50 transition-all duration-300 card-hover-lift card-3d-inner">
                      {/* Mobile Layout */}
                      <div className="md:hidden space-y-4">
                        {/* Date Badge */}
                        <div className="flex items-start gap-3">
                          <div className="card-dark p-2.5 text-center border-2 border-[#F59E0B]/40 flex-shrink-0 w-16">
                            <div className="text-[9px] font-semibold text-[#F59E0B] uppercase tracking-wider mb-0.5">
                              {eventDate.weekday}
                            </div>
                            <div className="text-lg font-extrabold text-[#F59E0B] mb-0.5">
                              {eventDate.day}
                            </div>
                            <div className="text-[9px] font-medium text-gray-400 uppercase">
                              {eventDate.month}
                            </div>
                          </div>

                          {/* Event Image - Smaller on mobile */}
                          <Link href={`/events/${encodeURIComponent(event.slug)}`} className="flex-1 max-w-[120px]">
                            <div className="relative aspect-square rounded-lg overflow-hidden group">
                              {event.image_path ? (
                                <SupabaseImage
                                  src={event.image_path}
                                  alt={event.title}
                                  fill
                                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                                  bucket="events"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#F59E0B]/20 to-[#F59E0B]/10 flex items-center justify-center">
                                  <Calendar className="h-6 w-6 text-[#F59E0B] opacity-50" />
                                </div>
                              )}
                            </div>
                          </Link>
                        </div>

                        {/* Content */}
                        <div className="space-y-3">
                          <h4 className="card-title text-lg">{event.title}</h4>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[#F59E0B]" />
                            <span className="text-sm text-[#F59E0B] font-semibold">
                              {formatTime(event.event_start)}
                              {eventEnd && ` - ${formatTime(event.event_end)}`}
                            </span>
                          </div>

                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="text-sm body-text">{event.location}</span>
                            </div>
                          )}

                          {event.description && (
                            <p className="body-text text-sm line-clamp-2">{event.description}</p>
                          )}

                          {(event.base_ticket_price || (event.event_tickets && event.event_tickets.length > 0)) && (
                            <div className="flex items-center gap-2">
                              <Ticket className="h-4 w-4 text-[#F59E0B]" />
                              <span className="text-sm font-semibold price-amber">
                                {event.base_ticket_price 
                                  ? `${event.ticket_currency === 'USD' ? '$' : '$'}${parseFloat(event.base_ticket_price.toString()).toFixed(2)}`
                                  : event.event_tickets && event.event_tickets.length > 0
                                    ? `From $${parseFloat(event.event_tickets[0].price.toString()).toFixed(2)}`
                                    : ''
                                }
                              </span>
                            </div>
                          )}

                          <Link href={`/events/${encodeURIComponent(event.slug)}`} className="block mt-4">
                            <button className="btn-amber-sm w-full">
                              View Details <ArrowRight className="ml-2 h-3.5 w-3.5 inline" />
                            </button>
                          </Link>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden md:grid grid-cols-12 gap-6 items-center">
                        {/* Date Section */}
                        <div className={`col-span-3 ${isEven ? 'order-1' : 'order-3'}`}>
                          <div className="card-dark p-5 text-center border-2 border-[#F59E0B]/40">
                            <div className="text-xs font-semibold text-[#F59E0B] uppercase tracking-wider mb-1">
                              {eventDate.weekday}
                            </div>
                            <div className="text-3xl font-extrabold text-[#F59E0B] mb-1">
                              {eventDate.day}
                            </div>
                            <div className="text-sm font-medium text-gray-400 uppercase">
                              {eventDate.month}
                            </div>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className={`col-span-6 ${isEven ? 'order-2' : 'order-2'} space-y-3`}>
                          <h4 className="card-title text-xl">{event.title}</h4>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[#F59E0B]" />
                            <span className="text-sm text-[#F59E0B] font-semibold">
                              {formatTime(event.event_start)}
                              {eventEnd && ` - ${formatTime(event.event_end)}`}
                            </span>
                          </div>

                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="text-sm body-text">{event.location}</span>
                            </div>
                          )}

                          {event.description && (
                            <p className="body-text text-sm line-clamp-3">{event.description}</p>
                          )}

                          {(event.base_ticket_price || (event.event_tickets && event.event_tickets.length > 0)) && (
                            <div className="flex items-center gap-2">
                              <Ticket className="h-4 w-4 text-[#F59E0B]" />
                              <span className="text-sm font-semibold price-amber">
                                {event.base_ticket_price 
                                  ? `${event.ticket_currency === 'USD' ? '$' : '$'}${parseFloat(event.base_ticket_price.toString()).toFixed(2)}`
                                  : event.event_tickets && event.event_tickets.length > 0
                                    ? `From $${parseFloat(event.event_tickets[0].price.toString()).toFixed(2)}`
                                    : ''
                                }
                              </span>
                            </div>
                          )}

                          <Link href={`/events/${encodeURIComponent(event.slug)}`} className="inline-block mt-4">
                            <button className="btn-amber-sm inline-flex items-center gap-2">
                              View Details <ArrowRight className="h-4 w-4" />
                            </button>
                          </Link>
                        </div>

                        {/* Image Section */}
                        <div className={`col-span-3 ${isEven ? 'order-3' : 'order-1'}`}>
                          <Link href={`/events/${encodeURIComponent(event.slug)}`}>
                            <div className="relative aspect-[4/5] rounded-xl overflow-hidden group cursor-pointer">
                              {event.image_path ? (
                                <SupabaseImage
                                  src={event.image_path}
                                  alt={event.title}
                                  fill
                                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                                  bucket="events"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#F59E0B]/20 to-[#F59E0B]/10 flex items-center justify-center">
                                  <Calendar className="h-12 w-12 text-[#F59E0B] opacity-50" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State for Selected Month */}
      {selectedMonthKey && currentMonthEvents.length === 0 && (
        <div className="text-center py-12 md:py-16">
          <div className="card-dark max-w-md mx-auto">
            <Calendar className="h-12 w-12 md:h-14 md:w-14 text-[#F59E0B] mx-auto mb-4 opacity-60" />
            <p className="body-text text-center">
              No events scheduled for {selectedMonthInfo?.monthName} {selectedMonthInfo?.year}.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
