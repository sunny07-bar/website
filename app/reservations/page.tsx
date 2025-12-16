'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Clock, Users, CheckCircle, AlertCircle, Sparkles, Info } from 'lucide-react'
import { getSpecialHoursForDate, getAvailableTimeSlots, getOpeningHours, getEventsForDate } from '@/lib/queries'
import AnimatedSection from '@/components/AnimatedSection'
import { getFloridaToday } from '@/lib/utils/timezone'

export default function ReservationsPage() {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    guestsCount: 2,
    reservationDate: '',
    reservationTime: '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [specialHoursInfo, setSpecialHoursInfo] = useState<any>(null)
  const [regularHours, setRegularHours] = useState<any>(null)
  const [customFields, setCustomFields] = useState<Record<string, string>>({})
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [eventsOnDate, setEventsOnDate] = useState<any[]>([])

  // Get today's date in YYYY-MM-DD format (Florida timezone)
  const today = getFloridaToday()

  // Load special hours and available slots when date or guest count changes
  useEffect(() => {
    if (formData.reservationDate) {
      loadHoursAndSlots()
    }
  }, [formData.reservationDate, formData.guestsCount])

  const loadHoursAndSlots = async () => {
    if (!formData.reservationDate) return

    setLoadingSlots(true)
    setAvailabilityError(null)
    
    try {
      console.log('[ReservationsPage] Loading hours for date:', formData.reservationDate)
      
      // Check for events on this date
      const events = await getEventsForDate(formData.reservationDate)
      setEventsOnDate(events)
      console.log('[ReservationsPage] Events found:', events.length)
      
      // Check for special hours first
      const specialHours = await getSpecialHoursForDate(formData.reservationDate)
      console.log('[ReservationsPage] Special hours:', specialHours)
      
      if (specialHours) {
        // Special hours exist for this date
        setSpecialHoursInfo(specialHours)
        console.log('[ReservationsPage] Special hours is_open:', specialHours.is_open)
        
        // Load custom fields if special hours exist
        if (specialHours.special_hours_fields && specialHours.special_hours_fields.length > 0) {
          const fields: Record<string, string> = {}
          specialHours.special_hours_fields.forEach((field: any) => {
            fields[field.field_key] = ''
          })
          setCustomFields(fields)
        }
        setRegularHours(null) // Clear regular hours when special hours exist
      } else {
        // No special hours - use regular opening hours
        const openingHours = await getOpeningHours()
        const dayOfWeek = new Date(formData.reservationDate).getDay()
        const hours = openingHours.find(h => h.weekday === dayOfWeek)
        console.log('[ReservationsPage] Regular hours for weekday', dayOfWeek, ':', hours)
        setRegularHours(hours)
        setSpecialHoursInfo(null)
        setCustomFields({})
      }

      // Get available time slots
      const slots = await getAvailableTimeSlots(formData.reservationDate, formData.guestsCount)
      console.log('[ReservationsPage] Available slots count:', slots.length)
      console.log('[ReservationsPage] First 5 slots:', slots.slice(0, 5))
      setAvailableSlots(slots)
      
      // Debug: Log what we have
      if (specialHours) {
        console.log('[ReservationsPage] Special hours details:', {
          title: specialHours.title,
          is_open: specialHours.is_open,
          time_from: specialHours.time_from,
          time_to: specialHours.time_to,
          has_seatings: !!specialHours.special_hours_seatings?.[0],
          seatings_interval: specialHours.special_hours_seatings?.[0]?.interval_minutes
        })
      }

      // If a time was selected, check if it's still available
      if (formData.reservationTime && !slots.includes(formData.reservationTime)) {
        setAvailabilityError('This time slot is no longer available')
        setFormData({ ...formData, reservationTime: '' })
      }
    } catch (error) {
      console.error('[ReservationsPage] Error loading slots:', error)
      setAvailabilityError('Failed to load available times. Please try again.')
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setAvailabilityError(null)

    try {
      const payload: any = {
        ...formData,
        specialHoursId: specialHoursInfo?.id || null,
        customFields: Object.keys(customFields).length > 0 ? customFields : null,
      }

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        
        // If prepayment is required, redirect to payment page
        if (data.prepaymentRequired && data.paymentUrl) {
          window.location.href = data.paymentUrl
          return
        }
        
        setSubmitStatus('success')
        setFormData({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          guestsCount: 2,
          reservationDate: '',
          reservationTime: '',
          notes: '',
        })
        setCustomFields({})
        setSpecialHoursInfo(null)
        setRegularHours(null)
        setAvailableSlots([])
        setEventsOnDate([])
      } else {
        const errorData = await response.json()
        setAvailabilityError(errorData.error || 'Failed to create reservation')
        setSubmitStatus('error')
        
        // If it's an event conflict, reload events to show updated info
        if (errorData.eventConflict && errorData.event) {
          const events = await getEventsForDate(formData.reservationDate)
          setEventsOnDate(events)
        }
      }
    } catch (error) {
      setSubmitStatus('error')
      setAvailabilityError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-12 md:py-16">
      <AnimatedSection direction="down">
        <div className="text-center mb-14 md:mb-18">
          <div className="inline-block px-4 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded-full mb-5 md:mb-6">
            <span className="text-xs md:text-sm font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2 justify-center">
              <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Reservations
            </span>
          </div>
          <h1 className="text-display-1 font-extrabold heading-gradient-neon mb-5 md:mb-6 leading-tight display-heading">
            MAKE A RESERVATION
          </h1>
          <div className="w-20 md:w-28 h-0.5 md:h-1 bg-gradient-to-r from-amber-500 via-red-500 to-amber-500 mx-auto rounded-full mb-6 md:mb-7"></div>
          <p className="text-body-large bar-text-light max-w-3xl mx-auto">
            Book your table in advance and ensure a great dining experience.
          </p>
        </div>
      </AnimatedSection>

      <div className="max-w-4xl mx-auto">
        <AnimatedSection direction="up">
          <Card className="bar-card-premium shadow-2xl">
            <CardContent className="p-6 md:p-8 lg:p-10">
              {/* Special Hours Banner */}
              {specialHoursInfo && (
                <div className="mb-7 md:mb-8 p-5 md:p-6 bg-gradient-to-r from-amber-500/10 via-red-500/10 to-amber-500/10 rounded-xl border border-amber-500/25 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-2.5 shadow-lg">
                      <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2.5">
                        <h3 className="text-display-3 font-bold text-amber-400 display-heading">{specialHoursInfo.title}</h3>
                        <span className="px-2.5 py-1 bg-amber-500/20 rounded-full text-xs font-semibold text-amber-400">
                          Special Hours
                        </span>
                      </div>
                      {specialHoursInfo.time_from && specialHoursInfo.time_to && (
                        <p className="text-body bar-text-light mb-2 flex items-center gap-2">
                          <Clock className="h-4 w-4 md:h-5 md:w-5 text-amber-400" />
                          <span className="font-semibold">
                            {formatTime(specialHoursInfo.time_from)} - {formatTime(specialHoursInfo.time_to)}
                          </span>
                        </p>
                      )}
                      {specialHoursInfo.note && (
                        <p className="bar-text-muted text-body-small mt-2">{specialHoursInfo.note}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Regular Hours Info */}
              {!specialHoursInfo && regularHours && (
                <div className="mb-7 md:mb-8 p-4 bg-blue-500/10 rounded-xl border border-blue-500/25">
                  <div className="flex items-center gap-2.5 text-blue-400">
                    <Info className="h-4 w-4 md:h-5 md:w-5" />
                    <p className="text-body-small font-medium">
                      {regularHours.is_closed 
                        ? 'We are closed on this day'
                        : `Regular hours: ${formatTime(regularHours.open_time)} - ${formatTime(regularHours.close_time)}`
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Event Conflict Warning */}
              {eventsOnDate.length > 0 && (
                <div className="mb-7 md:mb-8 p-5 md:p-6 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-xl border border-blue-500/25 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-2.5 shadow-lg">
                      <Calendar className="h-5 w-5 md:h-6 md:w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-display-3 font-bold text-blue-400 display-heading">EVENT SCHEDULED</h3>
                        <span className="px-2.5 py-1 bg-blue-500/20 rounded-full text-xs font-semibold text-blue-400">
                          {eventsOnDate.length} Event{eventsOnDate.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="space-y-2.5 mb-4">
                        {eventsOnDate.map((event) => {
                          const eventStart = new Date(event.event_start)
                          const eventEnd = event.event_end 
                            ? new Date(event.event_end)
                            : new Date(eventStart.getTime() + 3 * 60 * 60 * 1000)
                          const bufferStart = new Date(eventStart.getTime() - 2 * 60 * 60 * 1000) // 2 hours before
                          const bufferEnd = new Date(eventEnd.getTime() + 2 * 60 * 60 * 1000) // 2 hours after
                          
                          const formatDateTime = (date: Date) => {
                            return date.toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })
                          }
                          
                          return (
                            <div key={event.id} className="bg-blue-500/5 rounded-lg p-3 border border-blue-500/20">
                              <p className="font-semibold text-blue-400 mb-1.5 text-body-small">{event.title}</p>
                              <p className="text-body-small text-blue-300 mb-2">
                                <Clock className="h-3.5 w-3.5 inline mr-1" />
                                Event: {formatDateTime(eventStart)} - {formatDateTime(eventEnd)}
                              </p>
                              <p className="text-xs text-blue-400/80">
                                Reservations blocked: {formatDateTime(bufferStart)} - {formatDateTime(bufferEnd)} (2-hour buffer)
                              </p>
                              <a 
                                href={`/events/${encodeURIComponent(event.slug)}`}
                                className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline mt-2 inline-block"
                              >
                                View Event & Purchase Tickets →
                              </a>
                            </div>
                          )
                        })}
                      </div>
                      <p className="text-body-small text-blue-300 font-medium">
                        ⚠️ Reservations are blocked 2 hours before and after each event. Please select a time outside the blocked period or purchase event tickets.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {submitStatus === 'success' && (
                <div className="mb-6 p-5 md:p-6 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <div className="flex items-center gap-3 text-green-400">
                    <CheckCircle className="h-5 w-5 md:h-6 md:w-6" />
                    <div>
                      <p className="font-bold text-body">Reservation submitted successfully!</p>
                      <p className="text-green-300 mt-1 text-body-small">
                        We'll confirm your reservation shortly. You'll receive a confirmation via phone or email.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 p-5 md:p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex items-center gap-3 text-red-400">
                    <AlertCircle className="h-5 w-5 md:h-6 md:w-6" />
                    <div>
                      <p className="font-bold text-body">Reservation Error</p>
                      <p className="text-red-300 mt-1 text-body-small">
                        {availabilityError || 'Something went wrong. Please try again or call us directly at (321) 316-4644.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                  <div>
                    <Label htmlFor="customerName" className="text-body-small font-semibold mb-2 block">
                      Name *
                    </Label>
                    <Input
                      id="customerName"
                      required
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      className="h-11 md:h-12 text-body bg-[hsl(220,14%,18%)] border-red-500/20 text-gray-200 placeholder:text-gray-500 focus:border-red-500/40"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="customerPhone" className="text-body-small font-semibold mb-2 block">
                      Phone *
                    </Label>
                    <Input
                      id="customerPhone"
                      required
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      className="h-11 md:h-12 text-body bg-[hsl(220,14%,18%)] border-red-500/20 text-gray-200 placeholder:text-gray-500 focus:border-red-500/40"
                      placeholder="(321) 555-0123"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="customerEmail" className="text-body-small font-semibold mb-2 block">
                    Email
                  </Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="h-11 md:h-12 text-body bg-[hsl(220,14%,18%)] border-red-500/20 text-gray-200 placeholder:text-gray-500 focus:border-red-500/40"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                  <div>
                    <Label htmlFor="reservationDate" className="text-body-small font-semibold mb-2 block flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber-400" />
                      Date *
                    </Label>
                    <Input
                      id="reservationDate"
                      required
                      type="date"
                      min={today}
                      value={formData.reservationDate}
                      onChange={(e) => setFormData({ ...formData, reservationDate: e.target.value, reservationTime: '' })}
                      className="h-12 text-base"
                    />
                    {specialHoursInfo && (
                      <p className="text-sm text-orange-600 mt-2 flex items-center gap-1">
                        <Sparkles className="h-4 w-4" />
                        <span>Special hours apply for this date</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="reservationTime" className="text-base font-semibold mb-2 block flex items-center gap-2">
                      <Clock className="h-5 w-5 bar-text-amber" />
                      Time *
                    </Label>
                    {!formData.reservationDate ? (
                      <div className="h-12 flex items-center justify-center border rounded-lg bg-gray-50">
                        <span className="text-sm text-gray-500">Please select a date first</span>
                      </div>
                    ) : loadingSlots ? (
                      <div className="h-12 flex items-center justify-center border rounded-lg bg-gray-50">
                        <span className="text-sm text-gray-500">Loading available times...</span>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div>
                        <select
                          id="reservationTime"
                          required
                          value={formData.reservationTime}
                          onChange={(e) => setFormData({ ...formData, reservationTime: e.target.value })}
                          className="w-full h-12 rounded-lg border border-gray-300 px-4 text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        >
                          <option value="">Select a time</option>
                          {availableSlots.map((slot) => (
                            <option key={slot} value={slot}>
                              {formatTime(slot)}
                            </option>
                          ))}
                        </select>
                        {specialHoursInfo && (
                          <p className="text-xs text-gray-500 mt-1">
                            {availableSlots.length} time slot{availableSlots.length !== 1 ? 's' : ''} available
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="h-12 flex items-center justify-center border-2 border-red-200 rounded-lg bg-red-50">
                        <span className="text-sm text-red-600 font-medium text-center px-2">
                          {specialHoursInfo && !specialHoursInfo.is_open
                            ? 'Restaurant is closed on this date'
                            : regularHours && regularHours.is_closed
                            ? 'We are closed on this day'
                            : specialHoursInfo && specialHoursInfo.is_open
                            ? 'No time slots available. Please check special hours configuration in admin panel.'
                            : 'No available time slots'}
                        </span>
                      </div>
                    )}
                    {availabilityError && (
                      <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {availabilityError}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="guestsCount" className="text-base font-semibold mb-2 block flex items-center gap-2">
                    <Users className="h-5 w-5 bar-text-amber" />
                    Number of Guests *
                  </Label>
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormData({
                        ...formData,
                        guestsCount: Math.max(1, formData.guestsCount - 1)
                      })}
                      className="h-12 w-12 text-xl font-bold"
                    >
                      −
                    </Button>
                    <Input
                      id="guestsCount"
                      type="number"
                      min="1"
                      max="12"
                      required
                      value={formData.guestsCount}
                      onChange={(e) => setFormData({
                        ...formData,
                        guestsCount: parseInt(e.target.value) || 1
                      })}
                      className="h-12 w-24 text-center text-xl font-bold"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormData({
                        ...formData,
                        guestsCount: Math.min(12, formData.guestsCount + 1)
                      })}
                      className="h-12 w-12 text-xl font-bold"
                    >
                      +
                    </Button>
                    <span className="text-sm bar-text-muted">(Max 12 guests)</span>
                  </div>
                  {specialHoursInfo?.special_hours_limits?.[0]?.max_guests_per_booking && (
                    <p className="text-sm text-orange-600 mt-2">
                      Maximum {specialHoursInfo.special_hours_limits[0].max_guests_per_booking} guests per booking for this event
                    </p>
                  )}
                </div>

                {/* Custom Fields from Special Hours */}
                {specialHoursInfo?.special_hours_fields?.map((field: any) => (
                  <div key={field.id}>
                    <Label htmlFor={field.field_key} className="text-base font-semibold mb-2 block">
                      {field.field_label} {field.is_required && '*'}
                    </Label>
                    {field.field_type === 'textarea' ? (
                      <Textarea
                        id={field.field_key}
                        required={field.is_required}
                        rows={4}
                        value={customFields[field.field_key] || ''}
                        onChange={(e) =>
                          setCustomFields({ ...customFields, [field.field_key]: e.target.value })
                        }
                        className="text-base"
                        placeholder={field.field_label}
                      />
                    ) : field.field_type === 'select' ? (
                      <select
                        id={field.field_key}
                        required={field.is_required}
                        value={customFields[field.field_key] || ''}
                        onChange={(e) =>
                          setCustomFields({ ...customFields, [field.field_key]: e.target.value })
                        }
                        className="w-full h-12 rounded-lg border border-gray-300 px-4 text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="">Select {field.field_label}</option>
                        {field.field_options?.map((option: string) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        id={field.field_key}
                        required={field.is_required}
                        type={field.field_type === 'number' ? 'number' : 'text'}
                        value={customFields[field.field_key] || ''}
                        onChange={(e) =>
                          setCustomFields({ ...customFields, [field.field_key]: e.target.value })
                        }
                        className="h-12 text-base"
                        placeholder={field.field_label}
                      />
                    )}
                  </div>
                ))}

                <div>
                  <Label htmlFor="notes" className="text-base font-semibold mb-2 block">
                    Special Requests or Notes
                  </Label>
                  <Textarea
                    id="notes"
                    rows={4}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="text-base"
                    placeholder="Any dietary restrictions, special occasions, or preferences..."
                  />
                </div>

                {/* Special Hours Payment Info */}
                {specialHoursInfo?.special_hours_payment?.[0]?.prepayment_required && (
                  <div className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-bold text-yellow-900 mb-1">Prepayment Required</p>
                        <p className="text-sm text-yellow-800">
                          {specialHoursInfo.special_hours_payment[0].prepayment_rule_type === 'percentage'
                            ? `${specialHoursInfo.special_hours_payment[0].prepayment_percentage}% prepayment required`
                            : specialHoursInfo.special_hours_payment[0].prepayment_rule_type === 'per_guest'
                            ? `$${specialHoursInfo.special_hours_payment[0].prepayment_amount} per guest prepayment required`
                            : `$${specialHoursInfo.special_hours_payment[0].prepayment_amount} prepayment required`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cancellation Policy */}
                {specialHoursInfo?.special_hours_payment?.[0]?.cancellation_policy && (
                  <div className="p-4 bg-blue-50/50 border border-blue-200/50 rounded-xl">
                    <p className="text-sm font-semibold text-blue-900 mb-1">Cancellation Policy</p>
                    <p className="text-sm text-blue-800">
                      {specialHoursInfo.special_hours_payment[0].cancellation_policy_custom ||
                        `Cancellation policy: ${specialHoursInfo.special_hours_payment[0].cancellation_policy}`}
                      {specialHoursInfo.special_hours_payment[0].cancellation_hours_before &&
                        ` (Cancel ${specialHoursInfo.special_hours_payment[0].cancellation_hours_before} hours before to avoid penalty)`}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting || loadingSlots || (availableSlots.length === 0 && !!formData.reservationDate)}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all font-bold text-lg py-7 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5 inline" />
                      Submit Reservation
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Info Card */}
        <AnimatedSection direction="up" delay={200}>
          <Card className="bar-card mt-8 border-2 border-orange-200/30">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 bar-text-amber mt-0.5" />
                  <div>
                    <p className="font-semibold bar-text-gold">Reservation Policy</p>
                    <p className="text-sm bar-text-muted">
                      Reservations are held for 15 minutes past the scheduled time. 
                      Please call if you're running late.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 bar-text-amber mt-0.5" />
                  <div>
                    <p className="font-semibold bar-text-gold">Large Parties</p>
                    <p className="text-sm bar-text-muted">
                      For parties of 8 or more, please call us directly at (321) 316-4644 
                      to ensure we can accommodate your group.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>
      </div>
    </div>
  )
}

