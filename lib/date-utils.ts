import { formatISO, parseISO } from 'date-fns'
import { formatInTimeZone as fnsFormatInTimeZone, toZonedTime } from 'date-fns-tz'

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

// Convert NY time to UTC
export function nyTimeToUTC(dateStr: string, timeStr: string): string {
  try {
    // Validate inputs
    if (!dateStr || !timeStr) {
      console.warn('Invalid date or time provided to nyTimeToUTC:', { dateStr, timeStr })
      return timeStr || '00:00:00'
    }
    
    // Ensure timeStr is in the correct format (HH:mm:ss)
    const formattedTimeStr = timeStr.length === 5 ? `${timeStr}:00` : timeStr
    
    // Combine date and time
    const dateTimeStr = `${dateStr}T${formattedTimeStr}`
    
    // Create a date object in NY timezone
    const nyDate = toZonedTime(new Date(dateTimeStr), NY_TIMEZONE)
    
    // Convert to UTC by creating a new Date (which is in UTC)
    const utcDate = new Date(nyDate.valueOf())
    
    // Format the time part only in UTC
    return fnsFormatInTimeZone(utcDate, 'UTC', 'HH:mm:ss')
  } catch (error) {
    console.error('Error in nyTimeToUTC:', error, { dateStr, timeStr })
    return timeStr || '00:00:00'
  }
}

// Convert UTC time to NY time
export function utcToNYTime(dateStr: string, timeStr: string): string {
  try {
    // Validate inputs
    if (!dateStr || !timeStr) {
      console.warn('Invalid date or time provided to utcToNYTime:', { dateStr, timeStr })
      return timeStr || '00:00:00'
    }
    
    // Remove any timezone information from the time string
    const cleanTimeStr = timeStr.replace(/([+-]\d{2}(:\d{2})?)?$/, '')
    
    // Ensure timeStr is in the correct format (HH:mm:ss)
    const formattedTimeStr = cleanTimeStr.length === 5 ? `${cleanTimeStr}:00` : cleanTimeStr
    
    // Combine date and time
    const dateTimeStr = `${dateStr}T${formattedTimeStr}Z` // Add Z to indicate UTC
    
    // Create a date object from UTC time
    const utcDate = new Date(dateTimeStr)
    
    // Convert to NY timezone
    const nyDate = toZonedTime(utcDate, NY_TIMEZONE)
    
    // Format the time part only in NY timezone
    return fnsFormatInTimeZone(nyDate, NY_TIMEZONE, 'HH:mm:ss')
  } catch (error) {
    console.error('Error in utcToNYTime:', error, { dateStr, timeStr })
    return timeStr || '00:00:00'
  }
}

export function convertToUTC(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  // Create a zoned time, then convert to UTC
  const zonedDate = toZonedTime(dateObj, NY_TIMEZONE)
  return new Date(zonedDate.valueOf())
}

export function parseAndFormatTime(timeStr: string): string {
  return timeStr.substring(0, 5)
} 