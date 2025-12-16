'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Clock, Ticket, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { getEventBySlug } from '@/lib/queries'
import SupabaseImage from '@/components/SupabaseImage'
import { formatFloridaTime, toFloridaTime } from '@/lib/utils/timezone'

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvent()
  }, [params.slug])

  const loadEvent = async () => {
    try {
      // Decode the slug from URL params (Next.js should handle this, but be explicit)
      const slug = decodeURIComponent(params.slug as string)
      console.log('Loading event with slug:', slug)
      
      const eventData = await getEventBySlug(slug)
      if (eventData) {
        console.log('Event loaded:', {
          id: eventData.id,
          title: eventData.title,
          base_ticket_price: eventData.base_ticket_price,
          ticket_currency: eventData.ticket_currency,
          event_tickets_count: eventData.event_tickets?.length || 0,
          event_tickets: eventData.event_tickets
        })
        setEvent(eventData)
      } else {
        console.error('Event not found for slug:', slug)
      }
    } catch (error) {
      console.error('Error loading event:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="section-bg-primary section-spacing">
        <div className="container-global text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-[#F59E0B]" />
          <p className="body-text">Loading event...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="section-bg-primary section-spacing">
        <div className="container-global text-center">
          <div className="card-premium max-w-md mx-auto">
            <p className="body-text text-lg">Event not found</p>
          </div>
        </div>
      </div>
    )
  }

  const eventStart = toFloridaTime(event.event_start)
  const eventEnd = event.event_end ? toFloridaTime(event.event_end) : null

  return (
    <div className="section-bg-primary section-spacing">
      <div className="container-global">
        {/* Hero Image */}
        <div className="h-[400px] md:h-[500px] rounded-2xl mb-12 relative overflow-hidden group border border-white/10">
          {event.image_path ? (
            <>
              <SupabaseImage
                src={event.image_path}
                alt={event.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
                priority
                bucket="events"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <h1 className="section-title text-white text-center px-4">{event.title}</h1>
              </div>
            </>
          ) : (
            <div className="h-full bg-gradient-to-br from-[#F59E0B]/30 to-[#F59E0B]/10">
              <div className="absolute inset-0 flex items-center justify-center">
                <h1 className="section-title text-white text-center px-4">{event.title}</h1>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="card-premium">
              <h2 className="card-title mb-8 text-[#F59E0B]">Event Details</h2>
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="bg-[#F59E0B]/10 rounded-xl p-3 border border-[#F59E0B]/20 flex-shrink-0">
                    <Calendar className="h-6 w-6 text-[#F59E0B]" />
                  </div>
                  <div>
                    <p className="font-semibold body-text mb-1">Date</p>
                    <p className="body-text opacity-80">{formatFloridaTime(eventStart, 'EEEE, MMMM d, yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-[#F59E0B]/10 rounded-xl p-3 border border-[#F59E0B]/20 flex-shrink-0">
                    <Clock className="h-6 w-6 text-[#F59E0B]" />
                  </div>
                  <div>
                    <p className="font-semibold body-text mb-1">Time</p>
                    <p className="body-text opacity-80">
                      {formatFloridaTime(eventStart, 'h:mm a')}
                      {eventEnd && ` - ${formatFloridaTime(eventEnd, 'h:mm a')}`}
                    </p>
                  </div>
                </div>
                {event.location && (
                  <div className="flex items-start gap-4">
                    <div className="bg-[#F59E0B]/10 rounded-xl p-3 border border-[#F59E0B]/20 flex-shrink-0">
                      <MapPin className="h-6 w-6 text-[#F59E0B]" />
                    </div>
                    <div>
                      <p className="font-semibold body-text mb-1">Location</p>
                      <p className="body-text opacity-80">{event.location}</p>
                    </div>
                  </div>
                )}
              </div>

              {event.description && (
                <div className="pt-6 border-t border-white/10">
                  <h3 className="card-title mb-4 text-[#F59E0B]">About This Event</h3>
                  <p className="body-text leading-relaxed text-base md:text-lg">{event.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tickets Sidebar */}
          <div>
            <div className="card-premium sticky top-24">
              <h3 className="card-title mb-6 flex items-center gap-3 text-[#F59E0B]">
                <div className="bg-[#F59E0B]/10 rounded-lg p-2 border border-[#F59E0B]/20">
                  <Ticket className="h-6 w-6 text-[#F59E0B]" />
                </div>
                Tickets
              </h3>
              {(() => {
                // Debug logging
                console.log('Event ticket check:', {
                  hasEventTickets: !!(event.event_tickets && event.event_tickets.length > 0),
                  eventTicketsLength: event.event_tickets?.length || 0,
                  hasBasePrice: !!event.base_ticket_price,
                  basePrice: event.base_ticket_price,
                  ticketCurrency: event.ticket_currency
                })

                if (event.event_tickets && event.event_tickets.length > 0) {
                  return (
                    <div className="space-y-4">
                      {event.event_tickets.map((ticket: any) => {
                        const available = (ticket.quantity_total || 0) - ticket.quantity_sold
                        return (
                          <div key={ticket.id} className="card-premium mb-4">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="card-title mb-2">{ticket.name}</h4>
                                <p className="text-3xl font-bold price-amber">
                                  ${ticket.price.toFixed(2)}
                                </p>
                              </div>
                            </div>
                            {ticket.quantity_total && (
                              <p className="body-text text-sm mb-4 opacity-75">
                                {available} of {ticket.quantity_total} available
                              </p>
                            )}
                            <button 
                              className="btn-amber w-full"
                              onClick={() => router.push(`/events/${encodeURIComponent(params.slug as string)}/purchase`)}
                            >
                              Buy Tickets
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )
                } else if (event.base_ticket_price && parseFloat(event.base_ticket_price.toString()) > 0) {
                  return (
                    <div className="card-premium">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="card-title mb-2">General Admission</h4>
                          <p className="text-3xl font-bold price-amber">
                            {event.ticket_currency === 'USD' ? '$' : 
                             event.ticket_currency === 'EUR' ? '€' :
                             event.ticket_currency === 'GBP' ? '£' :
                             event.ticket_currency === 'CAD' ? 'C$' :
                             event.ticket_currency === 'AUD' ? 'A$' : '$'}
                            {parseFloat(event.base_ticket_price.toString()).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <button 
                        className="btn-amber w-full"
                        onClick={() => router.push(`/events/${encodeURIComponent(params.slug as string)}/purchase`)}
                      >
                        Buy Tickets
                      </button>
                    </div>
                  )
                } else {
                  return (
                    <div className="text-center py-8">
                      <div className="card-premium">
                        <p className="body-text mb-2">No tickets available for this event.</p>
                        <p className="body-text text-sm opacity-75">
                          Please contact the venue for ticket information.
                        </p>
                      </div>
                    </div>
                  )
                }
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

