'use client'

import Link from 'next/link'
import { Bell, Search, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { getInitials } from '@/lib/utils'

interface HeaderProps {
  title: string
  subtitle?: string
  backHref?: string
}

export function Header({ title, subtitle, backHref }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [supabase])

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#E6E9EF]">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          {backHref && (
            <Link
              href={backHref}
              className="p-2 rounded-lg hover:bg-[#F5F6F8] text-[#676879] hover:text-[#323338] transition-all"
              title="חזרה"
            >
              <ArrowRight className="h-5 w-5" />
            </Link>
          )}
          <div>
            <h1 className="text-lg font-semibold text-[#323338]">{title}</h1>
            {subtitle && (
              <p className="text-xs text-[#676879]">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
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
          <button className="relative p-2 rounded-lg bg-white border border-[#E6E9EF] text-[#676879] hover:text-[#323338] hover:border-[#00A0B0] transition-all">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D83A52] text-[10px] font-bold text-white">
              3
            </span>
          </button>

          {/* User Avatar */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#F5F6F8] transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-[#00A0B0] flex items-center justify-center text-sm font-bold text-white">
              {getInitials(user?.email || 'U')}
            </div>
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
  )
}
