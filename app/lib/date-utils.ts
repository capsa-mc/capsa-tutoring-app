// Parse and format time to 24-hour format (HH:mm)
export function parseAndFormatTime(time: string): string {
  // Ensure the time is in HH:mm format
  const [hours, minutes] = time.split(':').map(Number)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

// Format time to 24-hour format for input value
export function formatTimeForInput(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

// Parse time from input value (24-hour format)
export function parseTimeFromInput(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
} 