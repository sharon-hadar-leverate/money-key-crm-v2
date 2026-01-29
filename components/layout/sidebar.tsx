'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LogOut, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import moneyKeyLogo from '@/app/assets/moneykey-linkdin3.png'
import dashboardIcon from '@/app/assets/dahsboard.png'
import leadsIcon from '@/app/assets/lead_table.png'
import manualsIcon from '@/app/assets/manuals.png'
import settingsIcon from '@/app/assets/settings.png'

const navigation = [
  { name: 'לוח בקרה', href: '/dashboard', image: dashboardIcon },
  { name: 'לידים', href: '/leads', image: leadsIcon },
  { name: 'הדרכות', href: '/playbooks', image: manualsIcon },
  { name: 'הגדרות', href: '/settings', image: settingsIcon },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="fixed top-4 right-4 z-50 md:hidden p-3 rounded-lg bg-white border border-[#E6E9EF] shadow-sm hover:shadow-md transition-shadow"
        aria-label="פתח תפריט"
      >
        <Menu className="h-5 w-5 text-[#323338]" />
      </button>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden transition-opacity"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed right-0 top-0 z-50 h-screen w-72 transition-transform duration-300 ease-out',
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full',
          'md:translate-x-0'
        )}
      >
        {/* White background with teal accent on left edge */}
        <div className="absolute inset-0 bg-white border-l-4 border-l-[#00A0B0] shadow-lg" />

        <div className="relative flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-5 border-b border-[#E6E9EF]">
            <div className="flex items-center gap-3">
              <Image
                src={moneyKeyLogo}
                alt="MoneyKey Logo"
                width={44}
                height={44}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-base font-bold text-[#323338]">מפתח הכסף</h1>
                <p className="text-xs text-[#676879]">ניהול לידים</p>
              </div>
            </div>
            {/* Close button - mobile only */}
            <button
              onClick={closeMobileMenu}
              className="md:hidden p-2 rounded-lg hover:bg-[#F5F6F8] transition-colors"
              aria-label="סגור תפריט"
            >
              <X className="h-5 w-5 text-[#676879]" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative',
                    isActive
                      ? 'bg-[#E5F6F7] text-[#00A0B0]'
                      : 'text-[#676879] hover:bg-[#F5F6F8] hover:text-[#323338]'
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#00A0B0] rounded-r-full" />
                  )}
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={24}
                    height={24}
                    className="shrink-0"
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Bottom section */}
          <div className="p-3 space-y-3 border-t border-[#E6E9EF]">
            {/* Quick stats card */}
            <div className="p-4 rounded-lg bg-[#F5F6F8]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#676879]">לידים החודש</span>
                <span className="text-xs text-[#00854D] font-medium bg-[#D4F4DD] px-2 py-0.5 rounded">+12%</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#323338] number-display">247</span>
                <span className="text-xs text-[#676879]">מתוך 300</span>
              </div>
              <div className="mt-3 progress-bar">
                <div className="progress-bar-fill" style={{ width: '82%' }} />
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#676879] hover:text-[#D83A52] hover:bg-[#FFD6D9]/30 transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
              התנתק
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
