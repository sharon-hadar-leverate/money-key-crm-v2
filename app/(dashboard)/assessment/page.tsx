import { redirect } from 'next/navigation'

// Redirect to the new tasks page
export default function AssessmentPage() {
  redirect('/tasks')
}
