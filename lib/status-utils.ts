import { STATUS_CONFIG, PIPELINE_STAGES, type LeadStatus, type PipelineStage } from '@/types/leads'

// Pre-computed Map for O(1) lookups (Vercel best practice: js-index-maps)
export const STATUS_MAP = new Map(
  Object.entries(STATUS_CONFIG) as [LeadStatus, typeof STATUS_CONFIG[LeadStatus]][]
)

// Pre-computed reverse lookup: status -> pipeline stage
export const STATUS_TO_STAGE_MAP = new Map<LeadStatus, PipelineStage>()
for (const [stage, statuses] of Object.entries(PIPELINE_STAGES)) {
  for (const status of statuses) {
    STATUS_TO_STAGE_MAP.set(status as LeadStatus, stage as PipelineStage)
  }
}

/**
 * Get status configuration with O(1) lookup
 */
export function getStatusConfig(status: string | null) {
  const key = (status || 'not_contacted') as LeadStatus
  return STATUS_MAP.get(key) ?? STATUS_MAP.get('not_contacted')!
}

/**
 * Get the pipeline stage for a status with O(1) lookup
 */
export function getStatusPipelineStage(status: string | null): PipelineStage {
  const key = (status || 'not_contacted') as LeadStatus
  return STATUS_TO_STAGE_MAP.get(key) ?? 'follow_up'
}

/**
 * Pipeline stage labels in Hebrew
 */
export const PIPELINE_LABELS: Record<PipelineStage, string> = {
  follow_up: 'מעקב',
  warm: 'חמים',
  hot: 'חמים מאוד',
  signed: 'לקוחות פעילים',
  lost: 'אבודים',
  future: 'עתידי',
}

/**
 * Get the index of a pipeline stage (for progress indicators)
 * Returns -1 for lost/future stages
 */
export function getPipelineStageIndex(stage: PipelineStage): number {
  const progressStages: PipelineStage[] = ['follow_up', 'warm', 'hot', 'signed']
  return progressStages.indexOf(stage)
}
