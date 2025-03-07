import { formatISO, parseISO } from 'date-fns'
import { formatInTimeZone as fnsFormatInTimeZone } from 'date-fns-tz'

const NY_TIMEZONE = 'America/New_York'

export function formatInTimeZone(date: Date | string, formatStr: string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return fnsFormatInTimeZone(dateObj, NY_TIMEZONE, formatStr)
}

export function getCurrentDate(): Date {
  const now = new Date()
  return parseISO(fnsFormatInTimeZone(now, NY_TIMEZONE, 'yyyy-MM-dd'))
}

export function formatToISO(date: Date): string {
  return formatISO(date, { representation: 'date' })
}

export function convertToUTC(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  // Since we don't have zonedTimeToUtc, we'll use a different approach
  const nyTime = fnsFormatInTimeZone(dateObj, NY_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
  return new Date(nyTime)
}

export function parseAndFormatTime(timeStr: string): string {
  return timeStr.substring(0, 5)
} 