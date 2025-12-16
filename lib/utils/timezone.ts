import { format, parseISO } from 'date-fns'
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz'

// Florida timezone (America/New_York covers Florida's Eastern Time)
export const FLORIDA_TIMEZONE = 'America/New_York'

/**
 * Convert a date to Florida timezone
 */
export function toFloridaTime(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return toZonedTime(dateObj, FLORIDA_TIMEZONE)
}

/**
 * Format a date in Florida timezone
 */
export function formatFloridaTime(
  date: Date | string,
  formatStr: string
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return formatInTimeZone(dateObj, FLORIDA_TIMEZONE, formatStr)
}

/**
 * Get current date/time in Florida timezone
 */
export function getFloridaNow(): Date {
  return toZonedTime(new Date(), FLORIDA_TIMEZONE)
}

/**
 * Get today's date in YYYY-MM-DD format in Florida timezone
 */
export function getFloridaToday(): string {
  const floridaNow = getFloridaNow()
  return format(floridaNow, 'yyyy-MM-dd')
}

/**
 * Convert a Florida timezone date to UTC for database storage
 */
export function floridaToUTC(date: Date): Date {
  return fromZonedTime(date, FLORIDA_TIMEZONE)
}

/**
 * Check if an event is still active (hasn't ended yet)
 * - If event has event_end: event is visible until event_end time
 * - If no event_end: event is visible for the whole day of event_start
 * - Event should not appear if it has already ended
 */
export function isEventActive(event: { event_start: string | Date; event_end?: string | Date | null }): boolean {
  try {
    const now = getFloridaNow()
    
    if (!event.event_start) {
      return false
    }
    
    const eventStart = typeof event.event_start === 'string' 
      ? toFloridaTime(parseISO(event.event_start))
      : toFloridaTime(event.event_start)
    
    if (isNaN(eventStart.getTime())) {
      return false
    }
    
    // If event has an end date/time, check if it has ended
    if (event.event_end) {
      const eventEnd = typeof event.event_end === 'string'
        ? toFloridaTime(parseISO(event.event_end))
        : toFloridaTime(event.event_end)
      
      if (!isNaN(eventEnd.getTime())) {
        // Event is active if current time is before the end time
        return now < eventEnd
      }
    }
    
    // If no end time, event is visible for the whole day of the start date
    // Set to end of the event start day (23:59:59.999)
    const eventStartDayEnd = new Date(eventStart)
    eventStartDayEnd.setHours(23, 59, 59, 999)
    
    // Event is active if current time is before the end of the start day
    return now <= eventStartDayEnd
  } catch (error) {
    console.error('Error checking if event is active:', error, event)
    return false
  }
}

