// Client-side utilities for announcement dismissal using localStorage

const STORAGE_KEY = 'dismissed_announcements'

/**
 * Check if an announcement has been dismissed by the user
 */
export function isDismissed(announcementId: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    const dismissed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(dismissed) && dismissed.includes(announcementId)
  } catch {
    return false
  }
}

/**
 * Dismiss an announcement - it won't show again until a new ID is used
 */
export function dismissAnnouncement(announcementId: string): void {
  if (typeof window === 'undefined') return

  try {
    const dismissed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    if (Array.isArray(dismissed) && !dismissed.includes(announcementId)) {
      dismissed.push(announcementId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed))
    }
  } catch {
    // If parsing fails, start fresh
    localStorage.setItem(STORAGE_KEY, JSON.stringify([announcementId]))
  }
}

/**
 * Clear all dismissed announcements (useful for testing)
 */
export function clearDismissedAnnouncements(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Get all dismissed announcement IDs
 */
export function getDismissedAnnouncements(): string[] {
  if (typeof window === 'undefined') return []

  try {
    const dismissed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(dismissed) ? dismissed : []
  } catch {
    return []
  }
}
