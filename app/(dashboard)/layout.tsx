import { Sidebar } from '@/components/layout/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <Sidebar />
      {/* No margin on mobile, 288px (18rem/w-72) margin on desktop for sidebar */}
      <main className="md:ms-72 min-h-screen">
        {children}
      </main>
    </div>
  )
}
