import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { AssessmentFormWrapper } from './form-wrapper'
import {
  getQuestionnaireBySlug,
  getResponseForTarget,
} from '@/actions/questionnaire'
import { createClient } from '@/lib/supabase/server'
import { ArrowRight } from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function TaskQuestionnairePage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get questionnaire with fields
  const questionnaire = await getQuestionnaireBySlug(slug)

  if (!questionnaire || questionnaire.category !== 'business') {
    notFound()
  }

  // For dev mode, use a stable dev user ID if no user is logged in
  const effectiveUserId = user?.id ?? (process.env.BYPASS_AUTH === 'true' ? '00000000-0000-0000-0000-000000000000' : '')

  // Get user's response
  const response = effectiveUserId
    ? await getResponseForTarget(questionnaire.id, 'business', effectiveUserId)
    : null

  // Debug: Log response to see if data is being fetched
  if (process.env.NODE_ENV === 'development') {
    console.log('Questionnaire response:', {
      hasResponse: !!response,
      status: response?.status,
      answersCount: response?.answers ? Object.keys(response.answers).length : 0,
    })
  }

  const settings = questionnaire.settings
  const color = settings.color as string | undefined ?? '#00A0B0'

  return (
    <>
      <Header
        title={questionnaire.name}
        subtitle={questionnaire.description || 'שאלון הערכת עסק'}
      />
      <div className="p-6">
        {/* Back Link */}
        <Link
          href="/tasks"
          className="inline-flex items-center gap-2 text-sm text-[#676879] hover:text-[#323338] mb-6 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          חזרה לכל המשימות
        </Link>

        {/* Questionnaire Form Card */}
        <div className="monday-card">
          {/* Colored header */}
          <div
            className="h-2 rounded-t-xl"
            style={{ backgroundColor: color }}
          />

          <div className="p-6">
            <AssessmentFormWrapper
              questionnaire={questionnaire}
              response={response}
              userId={effectiveUserId}
            />
          </div>
        </div>
      </div>
    </>
  )
}
