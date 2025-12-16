import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Calendar, MapPin, Clock, ArrowRight, Music, Sparkles, Ticket } from 'lucide-react'
import { format } from 'date-fns'
import { getEvents } from '@/lib/queries'
import SupabaseImage from '@/components/SupabaseImage'
import AnimatedSection from '@/components/AnimatedSection'
import EventsTimeline from '@/components/EventsTimeline'
import { isEventActive } from '@/lib/utils/timezone'

export default async function EventsPage() {
  const allEvents = await getEvents()
  console.log(`[EventsPage] Total events fetched: ${allEvents.length}`)

  // Filter featured events to only show active ones (haven't ended yet)
  const featuredEvents = allEvents.filter(e => {
    const isFeatured = e.is_featured
    const active = isEventActive(e)
    if (isFeatured && !active) {
      console.log(`[EventsPage] Filtered out ended featured event: ${e.title}`)
    }
    return isFeatured && active
  })

  const events = allEvents

  return (
    <div className="section-bg-primary section-spacing">
      <div className="container-global">
        <div className="text-center mb-16 md:mb-20">
          <h1 className="section-title mb-4">
            MUSIC & EVENTS
          </h1>
          <div className="section-divider mb-6"></div>
          <p className="body-text max-w-3xl mx-auto text-lg">
            us for amazing live music performances and special events throughout the week.
          </p>
        </div>

        {/* Featured Events */}
        {featuredEvents.length > 0 && (
          <div className="mb-16 md:mb-20">
            <div className="text-center mb-10 md:mb-12">
              <h2 className="section-title mb-4">FEATURED EVENTS</h2>
              <div className="section-divider"></div>
            </div>

            {/* Featured Events List - Horizontal Timeline Style */}
            <div className="space-y-0">
              {featuredEvents.map((event, index) => {
                const eventStart = new Date(event.event_start)
                const eventEnd = event.event_end ? new Date(event.event_end) : null
                const eventDate = {
                  weekday: format(eventStart, 'EEE'),
                  day: format(eventStart, 'd'),
                  month: format(eventStart, 'MMM'),
                  full: format(eventStart, 'MMMM d, yyyy')
                }

                return (
                  <div
                    key={event.id}
                    className={`border-b border-white/10 last:border-b-0 ${index > 0 ? 'pt-5 md:pt-8' : ''
                      } ${index < featuredEvents.length - 1 ? 'pb-5 md:pb-8' : ''}`}
                  >
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-4">
                      {/* Date and Image Row */}
                      <div className="flex gap-3 items-start">
                        {/* Date Block */}
                        <div className="card-premium p-4 text-center flex-shrink-0 border-2 border-[#F59E0B]/40">
                          <div className="text-[10px] font-semibold text-[#F59E0B] uppercase tracking-wider mb-0.5">
                            {eventDate.weekday}
                          </div>
                          <div className="text-xl font-extrabold text-[#F59E0B] mb-0.5">
                            {eventDate.day}
                          </div>
                          <div className="text-[10px] font-medium text-gray-400 uppercase">
                            {eventDate.month}
                          </div>
                          <div className="mt-1.5">
                            <span className="px-1.5 py-0.5 bg-[#F59E0B]/20 text-[#F59E0B] text-[8px] font-bold rounded uppercase">
                              Featured
                            </span>
                          </div>
                        </div>

                        {/* Event Image */}
                        <Link href={`/events/${encodeURIComponent(event.slug)}`} className="flex-1">
                          <div className="relative aspect-[16/10] rounded-xl overflow-hidden card-premium p-0 group border-2 border-[#F59E0B]/30">
                            {event.image_path ? (
                              <SupabaseImage
                                src={event.image_path}
                                alt={event.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                bucket="events"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#111111] flex items-center justify-center">
                                <Calendar className="h-8 w-8 text-[#F59E0B] opacity-50" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span className="absolute top-2 right-2 bg-[#F59E0B] text-black px-2 py-1 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              Featured
                            </span>
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
                            {format(eventStart, 'h:mm a')}
                            {eventEnd && ` - ${format(eventEnd, 'h:mm a')}`}
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
                        </div>

                        {/* CTA Button */}
                        <Link href={`/events/${encodeURIComponent(event.slug)}`} className="block">
                          <button className="btn-amber-sm w-full">
                            Learn More <ArrowRight className="ml-2 h-3.5 w-3.5 inline" />
                          </button>
                        </Link>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:grid grid-cols-12 gap-4 md:gap-6 items-start max-w-5xl mx-auto">
                      {/* Date Block - Left */}
                      <div className="lg:col-span-2">
                        <div className="card-premium p-5 md:p-6 text-center border-2 border-[#F59E0B]/40">
                          <div className="text-xs md:text-sm font-semibold text-[#F59E0B] uppercase tracking-wider mb-1">
                            {eventDate.weekday}
                          </div>
                          <div className="text-2xl md:text-3xl font-extrabold text-[#F59E0B] mb-1">
                            {eventDate.day}
                          </div>
                          <div className="text-xs md:text-sm font-medium text-gray-400 uppercase mb-2">
                            {eventDate.month}
                          </div>
                          <span className="px-2 py-1 bg-[#F59E0B]/20 text-[#F59E0B] text-xs font-bold rounded uppercase">
                            Featured
                          </span>
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
                              {format(eventStart, 'h:mm a')}
                              {eventEnd && ` - ${format(eventEnd, 'h:mm a')}`}
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
                        </div>

                        {/* CTA Button */}
                        <div className="mt-4">
                          <Link href={`/events/${encodeURIComponent(event.slug)}`}>
                            <button className="btn-amber-sm inline-flex items-center gap-2">
                              Learn More <ArrowRight className="h-4 w-4" />
                            </button>
                          </Link>
                        </div>
                      </div>

                      {/* Event Image - Right */}
                      <div className="lg:col-span-3">
                        <Link href={`/events/${encodeURIComponent(event.slug)}`}>
                          <div className="relative aspect-[4/5] rounded-xl overflow-hidden card-premium p-0 group cursor-pointer border-2 border-[#F59E0B]/30">
                            {event.image_path ? (
                              <SupabaseImage
                                src={event.image_path}
                                alt={event.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                bucket="events"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#111111] flex items-center justify-center">
                                <Calendar className="h-12 w-12 text-[#F59E0B] opacity-50" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span className="absolute top-4 right-4 bg-[#F59E0B] text-black px-3 py-1.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-1.5 z-10">
                              <Sparkles className="h-3.5 w-3.5" />
                              Featured
                            </span>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Timeline Events Listing */}
        <div>
          <EventsTimeline events={events} />
        </div>
      </div>
    </div>
  )
}

