import { Suspense } from 'react'
import { KPICards } from '@/components/dashboard/kpi-cards'
import { LeadsTrendChart } from '@/components/dashboard/leads-trend-chart'
import { SourceTrendChart } from '@/components/dashboard/source-trend-chart'
import { SourcePerformanceTable } from '@/components/dashboard/source-performance-table'
import { StatusBreakdownChart } from '@/components/dashboard/status-breakdown-chart'
import { CampaignChart } from '@/components/dashboard/campaign-chart'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import {
  getLeadKPIs,
  getDailyTrends,
  getSourcePerformance,
  getStatusBreakdown,
  getCampaignPerformance,
  getRecentActivity,
  getSourceTrends,
} from '@/actions/kpis'
import { endOfDay, startOfDay, format } from 'date-fns'

interface DashboardPageProps {
  searchParams: Promise<{ from?: string; to?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams

  // Parse date range from search params
  const dateFrom = params.from
    ? format(startOfDay(new Date(params.from)), "yyyy-MM-dd'T'HH:mm:ss")
    : undefined
  const dateTo = params.to
    ? format(endOfDay(new Date(params.to)), "yyyy-MM-dd'T'HH:mm:ss")
    : undefined

  const [kpis, dailyTrends, sourcePerf, statusBreakdown, campaigns, activities, sourceTrends] = await Promise.all([
    getLeadKPIs(dateFrom, dateTo),
    getDailyTrends(30, dateFrom, dateTo),
    getSourcePerformance(dateFrom, dateTo),
    getStatusBreakdown(dateFrom, dateTo),
    getCampaignPerformance(dateFrom, dateTo),
    getRecentActivity(5),
    getSourceTrends(30, dateFrom, dateTo),
  ])

  return (
    <>
      <Suspense fallback={null}>
        <DashboardHeader />
      </Suspense>
      <div className="p-6 space-y-6">
        {/* KPI Cards - Pipeline stages */}
        <KPICards kpis={kpis} />

        {/* Row 1: Leads Trend (full width) */}
        <LeadsTrendChart data={dailyTrends} />

        {/* Row 2: Status Breakdown (full width) */}
        <StatusBreakdownChart data={statusBreakdown} />

        {/* Row 3: Leads by Source Over Time (full width) */}
        <SourceTrendChart data={sourceTrends.data} sources={sourceTrends.sources} />

        {/* Row 4: Source Performance & Campaign Chart */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SourcePerformanceTable data={sourcePerf} />
          <CampaignChart data={campaigns} />
        </div>

        {/* Row 5: Recent Activity */}
        <RecentActivity activities={activities} />
      </div>
    </>
  )
}
