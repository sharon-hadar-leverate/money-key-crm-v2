import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/layout/header'
import visionImage from '@/app/assets/vision_022026.png'
import { QuestionnaireCard } from '@/components/questionnaire'
import { TaskList } from '@/components/tasks'
import { TasksPageClient } from './tasks-page-client'
import { getQuestionnaires, getResponses, getQuestionnaireById } from '@/actions/questionnaire'
import { getMyTasks } from '@/actions/tasks'
import { calculateProgress } from '@/lib/questionnaire-utils'
import { createClient } from '@/lib/supabase/server'
import { ClipboardList, CheckSquare } from 'lucide-react'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get effective user ID (for dev mode)
  const effectiveUserId = user?.id ?? (process.env.BYPASS_AUTH === 'true' ? '00000000-0000-0000-0000-000000000000' : '')

  // Get all business questionnaires
  const questionnaires = await getQuestionnaires({ category: 'business', isActive: true })

  // Get user's responses for business questionnaires
  const responses = effectiveUserId
    ? await getResponses({
        target_type: 'business',
        target_id: effectiveUserId,
      })
    : []

  // Map responses by questionnaire ID
  const responseMap = new Map(responses.map(r => [r.questionnaire_id, r]))

  // Get progress for each questionnaire
  const questionnairesWithProgress = await Promise.all(
    questionnaires.map(async (q) => {
      const response = responseMap.get(q.id)
      const fullQ = await getQuestionnaireById(q.id)
      const progress = fullQ
        ? calculateProgress(fullQ.fields, response?.answers ?? {})
        : null
      return { questionnaire: q, response, progress }
    })
  )

  // Filter to incomplete questionnaires
  const incompleteQuestionnaires = questionnairesWithProgress.filter(
    q => q.response?.status !== 'completed'
  )

  // Get manual tasks
  const { tasks } = await getMyTasks({
    statuses: ['pending', 'in_progress', 'completed'],
    limit: 50,
  })

  // Stats
  const completedQuestionnaires = questionnairesWithProgress.filter(
    q => q.response?.status === 'completed'
  ).length
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length
  const totalTasks = incompleteQuestionnaires.length + pendingTasks

  return (
    <>
      <Header title="משימות" subtitle={`${totalTasks} משימות פתוחות`} />
      <div className="p-6">
        {/* Summary Card */}
        <div className="monday-card p-5 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#E5F6F7]">
                <ClipboardList className="w-6 h-6 text-[#00A0B0]" />
              </div>
              <div>
                <h2 className="font-semibold text-[#323338]">סטטוס משימות</h2>
                <p className="text-sm text-[#676879]">
                  {incompleteQuestionnaires.length} שאלונים להשלמה, {pendingTasks} משימות פתוחות
                </p>
              </div>
            </div>
            <TasksPageClient />
          </div>
        </div>

        {/* Vision Section */}
        <div className="monday-card p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            {/* Image */}
            <div className="w-full lg:w-1/2">
              <Image
                src={visionImage}
                alt="Money-Key Business Knowledge Base"
                className="rounded-lg w-full h-auto"
              />
            </div>

            {/* Text Content */}
            <div className="w-full lg:w-1/2 space-y-4">
              <h2 className="text-xl font-bold text-[#323338]">החזון שלנו</h2>
              <p className="text-[#676879] leading-relaxed">
                Money-Key מתמחה בהחזרי מס לשכירים. המשימות בעמוד זה עוזרות לנו
                לבנות בסיס ידע עסקי מקיף ב-6 תחומים מרכזיים:
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-[#E5F6E6] text-[#00854D] text-sm font-medium">💰 פיננסים</span>
                <span className="px-3 py-1 rounded-full bg-[#FFF3E0] text-[#D97706] text-sm font-medium">⚙️ תפעול</span>
                <span className="px-3 py-1 rounded-full bg-[#E3F2FD] text-[#1976D2] text-sm font-medium">📣 שיווק</span>
                <span className="px-3 py-1 rounded-full bg-[#FCE4EC] text-[#C2185B] text-sm font-medium">🤝 מכירות</span>
                <span className="px-3 py-1 rounded-full bg-[#EDE7F6] text-[#7B1FA2] text-sm font-medium">💻 טכנולוגיה</span>
                <span className="px-3 py-1 rounded-full bg-[#E5F6F7] text-[#00A0B0] text-sm font-medium">🎯 אסטרטגיה</span>
              </div>
              <p className="text-sm text-[#676879]">
                מילוי השאלונים יאפשר לנו לתכנן, לעקוב, לאתר הזדמנויות
                אוטומציה ולקבל החלטות מבוססות נתונים.
              </p>
            </div>
          </div>
        </div>

        {/* Questionnaires Section */}
        {incompleteQuestionnaires.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5 text-[#676879]" />
              <h2 className="font-semibold text-[#323338]">
                שאלונים להשלמה ({incompleteQuestionnaires.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incompleteQuestionnaires.map(({ questionnaire, response, progress }) => (
                <Link key={questionnaire.id} href={`/tasks/${questionnaire.slug}`}>
                  <QuestionnaireCard
                    questionnaire={questionnaire}
                    response={response}
                    progress={progress}
                  />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tasks Section */}
        <div className="monday-card p-5">
          <TaskList
            tasks={tasks}
            title="משימות"
            emptyMessage="אין משימות פתוחות. צור משימה חדשה כדי להתחיל."
          />
        </div>

        {/* Completed Questionnaires Section */}
        {completedQuestionnaires > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <CheckSquare className="w-5 h-5 text-[#00854D]" />
              <h2 className="font-semibold text-[#323338]">
                שאלונים שהושלמו ({completedQuestionnaires})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {questionnairesWithProgress
                .filter(q => q.response?.status === 'completed')
                .map(({ questionnaire, response, progress }) => (
                  <Link key={questionnaire.id} href={`/tasks/${questionnaire.slug}`}>
                    <QuestionnaireCard
                      questionnaire={questionnaire}
                      response={response}
                      progress={progress}
                    />
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
