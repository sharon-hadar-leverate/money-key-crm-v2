// Hardcoded announcement configuration
// Change the ID to show a new announcement to users who dismissed the previous one

export type AnnouncementType = 'info' | 'success' | 'warning'

export interface Announcement {
  id: string                    // Change this ID for new announcements
  type: AnnouncementType
  title: string
  message: string
  actionText?: string           // Optional CTA button
  actionHref?: string           // Optional link
  expiresAt?: string            // Optional expiry date (YYYY-MM-DD)
}

// Current active announcement - set to null when no announcement should be shown
export const CURRENT_ANNOUNCEMENT: Announcement | null = {
  id: 'welcome-tasks-2026-02',
  type: 'info',
  title: 'ברוכים הבאים למערכת המשימות החדשה!',
  message: 'כעת תוכלו לנהל משימות, לעקוב אחר שאלונים ולקבל התראות בזמן אמת.',
  actionText: 'למד עוד',
  actionHref: '/tasks',
  expiresAt: '2026-03-01',
}

// Helper to check if announcement is still valid
export function isAnnouncementValid(announcement: Announcement | null): boolean {
  if (!announcement) return false

  if (announcement.expiresAt) {
    const expiryDate = new Date(announcement.expiresAt)
    const now = new Date()
    if (now > expiryDate) {
      return false
    }
  }

  return true
}
