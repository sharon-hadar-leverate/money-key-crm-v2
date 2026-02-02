'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NotificationDropdown } from './notification-dropdown'
import { getUnreadCount, getRecentNotifications } from '@/actions/notifications'
import type { Notification } from '@/types/notifications'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const loadData = useCallback(async () => {
    try {
      const [count, recent] = await Promise.all([
        getUnreadCount(),
        getRecentNotifications(10),
      ])
      setUnreadCount(count)
      setNotifications(recent)
    } catch {
      // Silently handle errors - table may not exist yet
      setUnreadCount(0)
      setNotifications([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()

    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [loadData])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      // Refresh when opening
      loadData()
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className={cn(
          'relative p-2 rounded-lg bg-white border border-[#E6E9EF] text-[#676879] hover:text-[#323338] transition-all',
          isOpen && 'border-[#00A0B0] text-[#00A0B0]'
        )}
        aria-label="התראות"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D83A52] text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 z-50">
          <NotificationDropdown
            notifications={notifications}
            onRefresh={loadData}
          />
        </div>
      )}
    </div>
  )
}
