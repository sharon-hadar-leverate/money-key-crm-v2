import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Hebrew date formatting
export function formatDate(date: string | Date | null): string {
  if (!date) return '-'
  return new Intl.DateTimeFormat('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date | null): string {
  if (!date) return '-'
  return new Intl.DateTimeFormat('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date | null): string {
  if (!date) return '-'

  const now = new Date()
  const then = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (diffInSeconds < 60) return 'לפני רגע'
  if (diffInSeconds < 3600) return `לפני ${Math.floor(diffInSeconds / 60)} דקות`
  if (diffInSeconds < 86400) return `לפני ${Math.floor(diffInSeconds / 3600)} שעות`
  if (diffInSeconds < 604800) return `לפני ${Math.floor(diffInSeconds / 86400)} ימים`

  return formatDate(date)
}

// Hebrew currency formatting
export function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(value)
}

// Hebrew number formatting
export function formatNumber(value: number | null): string {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('he-IL').format(value)
}

// Hebrew percentage formatting
export function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('he-IL', {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(value / 100)
}

// Truncate text with ellipsis
export function truncate(text: string | null, length: number): string {
  if (!text) return ''
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

// Get initials from name (Hebrew-aware)
export function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}
