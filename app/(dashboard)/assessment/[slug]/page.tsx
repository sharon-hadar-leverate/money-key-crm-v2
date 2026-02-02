import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
}

// Redirect to the new tasks questionnaire page
export default async function AssessmentQuestionnairePage({ params }: PageProps) {
  const { slug } = await params
  redirect(`/tasks/${slug}`)
}
