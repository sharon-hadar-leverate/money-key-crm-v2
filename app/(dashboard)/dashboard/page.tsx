import { Suspense } from 'react'
import { KPICards } from '@/components/dashboard/kpi-cards'
import { LeadsTrendChart } from '@/components/dashboard/leads-trend-chart'
import { SourceTrendChart } from '@/components/dashboard/source-trend-chart'
import { SourcePerformanceTable } from '@/components/dashboard/source-performance-table'
import { StatusBreakdownChart } from '@/components/dashboard/status-breakdown-chart'
import { CampaignChart } from '@/components/dashboard/campaign-chart'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { UpcomingFollowups } from '@/components/dashboard/upcoming-followups'
import { DateRangeFilter } from '@/components/dashboard/date-range-filter'
import { MetricsExplanation } from '@/components/dashboard/metrics-explanation'
import { DataQualityPanel } from '@/components/dashboard/data-quality-panel'
import { PipelineVelocity } from '@/components/dashboard/pipeline-velocity'
import { CohortAnalysisTable } from '@/components/dashboard/cohort-analysis-table'
import { Header } from '@/components/layout/header'
import { AlertTriangle } from 'lucide-react'
import {
  getLeadKPIs,
  getDailyTrends,
  getSourcePerformance,
  getStatusBreakdown,
  getCampaignPerformance,
  getRecentActivity,
  getSourceTrends,
  getDataQualityStats,
  getCohortAnalysis,
  getPipelineVelocity,
  getDataQualityHealth,
} from '@/actions/kpis'
import { getLeads, getLeadsWithFollowUp } from '@/actions/leads'

interface DashboardPageProps {
  searchParams: Promise<{ from?: string; to?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams

  // Parse date range from search params
  const dateFrom = params.from
    ? params.from + 'T00:00:00.000Z'
    : undefined
  const dateTo = params.to
    ? params.to + 'T23:59:59.999Z'
    : undefined

  const isFiltered = !!(dateFrom || dateTo)

  const [kpis, dailyTrends, sourcePerf, statusBreakdown, campaigns,
         activities, sourceTrends, leadsResult, followUpLeads,
         dataQuality, cohortData, velocity, qualityHealth] = await Promise.all([
    getLeadKPIs(dateFrom, dateTo),
    getDailyTrends(30, dateFrom, dateTo),
    getSourcePerformance(dateFrom, dateTo),
    getStatusBreakdown(dateFrom, dateTo),
    getCampaignPerformance(dateFrom, dateTo),
    getRecentActivity(5),
    getSourceTrends(30, dateFrom, dateTo),
    getLeads({ limit: 100 }),
    getLeadsWithFollowUp(10),
    getDataQualityStats(dateFrom, dateTo),
    getCohortAnalysis(),
    getPipelineVelocity(),
    getDataQualityHealth(),
  ])

  const showCoverageWarning = isFiltered && dataQuality.eventCoverage < 0.8

  return (
    <>
      <Suspense fallback={null}>
        <Header
          title="לוח בקרה"
          subtitle="סקירת ביצועים כללית"
          actions={<DateRangeFilter />}
        />
      </Suspense>
      <div className="p-6 space-y-6">
        {/* Metrics Explanation (collapsible) — enhanced with live stats */}
        <MetricsExplanation qualityStats={dataQuality} isFiltered={isFiltered} />

        {/* Data Quality Health Panel (collapsible) */}
        <DataQualityPanel data={qualityHealth} />

        {/* Event Coverage Warning Banner — conditional */}
        {showCoverageWarning && (
          <div className="flex items-center gap-3 rounded-xl border border-[#FFE4B8] bg-[#FFF0D6] px-5 py-3">
            <AlertTriangle className="h-5 w-5 text-[#D17A00] shrink-0" />
            <p className="text-sm text-[#D17A00]">
              {Math.round((1 - dataQuality.eventCoverage) * 100)}% מהלידים ללא היסטוריית שינוי סטטוס — חלק מהנתונים עשויים להיות חלקיים
            </p>
          </div>
        )}

        {/* KPI Cards - Pipeline stages — enhanced with confidence + dual-mode */}
        <KPICards kpis={kpis} qualityStats={dataQuality} isFiltered={isFiltered} />

        {/* Pipeline Velocity */}
        <PipelineVelocity data={velocity} />

        {/* Leads Trend (full width) — enhanced with conversion warning */}
        <LeadsTrendChart data={dailyTrends} totalSignedLeads={dataQuality.totalSignedLeads} />

        {/* Status Breakdown (full width) */}
        <StatusBreakdownChart data={statusBreakdown} leads={leadsResult.data} />

        {/* Cohort Analysis Table */}
        <CohortAnalysisTable data={cohortData} />

        {/* Leads by Source Over Time (full width) */}
        <SourceTrendChart data={sourceTrends.data} sources={sourceTrends.sources} />

        {/* Source Performance & Campaign Chart */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SourcePerformanceTable data={sourcePerf} />
          <CampaignChart data={campaigns} />
        </div>

        {/* Upcoming Follow-ups & Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <UpcomingFollowups leads={followUpLeads} />
          <RecentActivity activities={activities} />
        </div>
      </div>
    </>
  )
}
