import { Header } from '@/components/layout/header'
import { KPICards } from '@/components/dashboard/kpi-cards'
import { ConversionChart } from '@/components/dashboard/conversion-chart'
import { UTMChart } from '@/components/dashboard/utm-chart'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { getLeadKPIs, getConversionFunnel, getUTMPerformance, getRecentActivity } from '@/actions/kpis'

export default async function DashboardPage() {
  const [kpis, funnel, utmData, activities] = await Promise.all([
    getLeadKPIs(),
    getConversionFunnel(),
    getUTMPerformance(),
    getRecentActivity(5),
  ])

  return (
    <>
      <Header title="לוח בקרה" subtitle="סקירת ביצועים כללית" />
      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <KPICards kpis={kpis} />

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ConversionChart data={funnel} />
          <UTMChart data={utmData} />
        </div>

        {/* Activity Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RecentActivity activities={activities} />

          {/* Quick Actions Card */}
          <div className="monday-card p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-[#EDD9FB]">
                <svg className="h-4 w-4 text-[#9D5BD2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#323338]">פעולות מהירות</h3>
                <p className="text-xs text-[#9B9BAD]">התחל לעבוד</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <a href="/leads/new" className="group flex items-center gap-3 p-4 rounded-lg bg-[#F5F6F8] hover:bg-[#D4F4DD]/30 border border-transparent hover:border-[#D4F4DD] transition-all">
                <div className="p-2 rounded-lg bg-[#D4F4DD] group-hover:scale-105 transition-transform">
                  <svg className="h-4 w-4 text-[#00854D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#323338]">ליד חדש</p>
                  <p className="text-xs text-[#9B9BAD]">הוסף ליד ידנית</p>
                </div>
              </a>

              <a href="/leads" className="group flex items-center gap-3 p-4 rounded-lg bg-[#F5F6F8] hover:bg-[#CCE5FF]/30 border border-transparent hover:border-[#CCE5FF] transition-all">
                <div className="p-2 rounded-lg bg-[#CCE5FF] group-hover:scale-105 transition-transform">
                  <svg className="h-4 w-4 text-[#0073EA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#323338]">כל הלידים</p>
                  <p className="text-xs text-[#9B9BAD]">צפה ונהל לידים</p>
                </div>
              </a>

              <a href="/settings" className="group flex items-center gap-3 p-4 rounded-lg bg-[#F5F6F8] hover:bg-[#FFF0D6]/30 border border-transparent hover:border-[#FFF0D6] transition-all">
                <div className="p-2 rounded-lg bg-[#FFF0D6] group-hover:scale-105 transition-transform">
                  <svg className="h-4 w-4 text-[#D17A00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#323338]">הגדרות</p>
                  <p className="text-xs text-[#9B9BAD]">התאם את המערכת</p>
                </div>
              </a>

              <div className="group flex items-center gap-3 p-4 rounded-lg bg-[#F5F6F8] hover:bg-[#EDD9FB]/30 border border-transparent hover:border-[#EDD9FB] transition-all cursor-pointer">
                <div className="p-2 rounded-lg bg-[#EDD9FB] group-hover:scale-105 transition-transform">
                  <svg className="h-4 w-4 text-[#9D5BD2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#323338]">דוחות</p>
                  <p className="text-xs text-[#9B9BAD]">בקרוב...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
