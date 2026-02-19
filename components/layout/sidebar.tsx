'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Bell, LogOut, Menu, X, ChevronsRight, ChevronsLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import moneyKeyLogo from '@/app/assets/moneykey-linkdin3.png'
import dashboardIcon from '@/app/assets/dahsboard_no_bg.png'
import leadsIcon from '@/app/assets/lead_table_no_bg.png'
import manualsIcon from '@/app/assets/manuals_no_bg.png'
import assessmentIcon from '@/app/assets/recomandations_no_bg.png'
import settingsIcon from '@/app/assets/settings_no_bg.png'
import type { LucideIcon } from 'lucide-react'
import type { StaticImageData } from 'next/image'

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed'

type NavItem = {
  name: string
  href: string
} & (
  | { image: StaticImageData; icon?: never }
  | { icon: LucideIcon; image?: never }
)

const navigation: NavItem[] = [
  { name: 'לוח בקרה', href: '/dashboard', image: dashboardIcon },
  { name: 'לידים', href: '/leads', image: leadsIcon },
  { name: 'הדרכות', href: '/playbooks', image: manualsIcon },
  { name: 'משימות', href: '/tasks', image: assessmentIcon },
  { name: 'התראות', href: '/notifications', icon: Bell },
  { name: 'הגדרות', href: '/settings', image: settingsIcon },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Load collapsed state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    if (stored === 'true') setCollapsed(true)
  }, [])

  // Sync collapsed state to CSS variable on <html> for layout margin
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      collapsed ? '4rem' : '18rem'
    )
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed))
  }, [collapsed])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const toggleCollapse = () => {
    setCollapsed(prev => !prev)
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
          'fixed right-0 top-0 z-50 h-screen transition-all duration-300 ease-out',
          collapsed ? 'w-16' : 'w-72',
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full',
          'md:translate-x-0'
        )}
      >
        {/* White background with teal accent on left edge */}
        <div className="absolute inset-0 bg-white border-l-4 border-l-[#00A0B0] shadow-lg" />

        <div className="relative flex h-full flex-col">
          {/* Logo */}
          <div className={cn(
            "flex h-16 items-center border-b border-[#E6E9EF]",
            collapsed ? "justify-center px-2" : "justify-between px-5"
          )}>
            <div className="flex items-center gap-3">
              <Image
                src={moneyKeyLogo}
                alt="MoneyKey Logo"
                width={collapsed ? 32 : 44}
                height={collapsed ? 32 : 44}
                className="rounded-lg shrink-0"
              />
              {!collapsed && (
                <div>
                  <h1 className="text-base font-bold text-[#323338]">Money Key</h1>
                  <p className="text-xs text-[#676879]">ניהול לידים</p>
                </div>
              )}
            </div>
            {/* Close button - mobile only */}
            {!collapsed && (
              <button
                onClick={closeMobileMenu}
                className="md:hidden p-2 rounded-lg hover:bg-[#F5F6F8] transition-colors"
                aria-label="סגור תפריט"
              >
                <X className="h-5 w-5 text-[#676879]" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className={cn("flex-1 py-4 space-y-1", collapsed ? "px-2" : "px-3")}>
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeMobileMenu}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    'flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-200 relative',
                    collapsed ? 'justify-center px-2' : 'gap-3 px-3',
                    isActive
                      ? 'bg-[#E5F6F7] text-[#00A0B0]'
                      : 'text-[#676879] hover:bg-[#F5F6F8] hover:text-[#323338]'
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#00A0B0] rounded-r-full" />
                  )}
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={24}
                      height={24}
                      className="shrink-0"
                    />
                  ) : (
                    <item.icon className="h-6 w-6 shrink-0" />
                  )}
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              )
            })}
          </nav>

          {/* Bottom section */}
          <div className={cn("space-y-3 border-t border-[#E6E9EF]", collapsed ? "p-2" : "p-3")}>
            {/* Quick stats card - hide when collapsed */}
            {!collapsed && (
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
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              title={collapsed ? 'התנתק' : undefined}
              className={cn(
                "flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-[#676879] hover:text-[#D83A52] hover:bg-[#FFD6D9]/30 transition-all duration-200",
                collapsed ? "justify-center px-2" : "gap-3 px-3"
              )}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!collapsed && <span>התנתק</span>}
            </button>

            {/* Collapse toggle - desktop only */}
            <button
              onClick={toggleCollapse}
              className="hidden md:flex w-full items-center justify-center rounded-lg py-2 text-[#9B9BAD] hover:text-[#676879] hover:bg-[#F5F6F8] transition-all duration-200"
              aria-label={collapsed ? 'הרחב תפריט' : 'כווץ תפריט'}
            >
              {collapsed ? (
                <ChevronsLeft className="h-5 w-5" />
              ) : (
                <ChevronsRight className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
