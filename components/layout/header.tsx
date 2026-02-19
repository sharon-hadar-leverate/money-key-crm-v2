'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import profileImage from '@/app/assets/profile_image_no_bg.png'
import { NotificationBell } from '@/components/notifications'
import { AnnouncementBanner } from '@/components/announcements/announcement-banner'

interface HeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  actions?: React.ReactNode
}

export function Header({ title, subtitle, backHref, actions }: HeaderProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [supabase])

  return (
    <>
      <AnnouncementBanner />
      <header className="sticky top-0 z-30 bg-white border-b border-[#E6E9EF]">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {backHref && (
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg hover:bg-[#F5F6F8] text-[#676879] hover:text-[#323338] transition-all"
                title="חזרה"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-semibold text-[#323338]">{title}</h1>
              {subtitle && (
                <p className="text-xs text-[#676879]">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Custom Actions */}
            {actions}

            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B9BAD]" />
              <input
                type="search"
                placeholder="חיפוש..."
                className="search-input"
              />
            </div>

            {/* Notifications */}
            <NotificationBell />

            {/* User Avatar */}
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#F5F6F8] transition-colors cursor-pointer">
              <Image
                src={profileImage}
                alt={user?.email?.split('@')[0] || 'User'}
                width={32}
                height={32}
                className="rounded-lg"
              />
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-[#323338] leading-none">
                  {user?.email?.split('@')[0] || 'משתמש'}
                </p>
                <p className="text-[10px] text-[#676879] mt-0.5">מנהל</p>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
