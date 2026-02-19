import { Sidebar } from '@/components/layout/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <Sidebar />
      {/* Margin driven by --sidebar-width CSS variable set by Sidebar component */}
      <main
        className="min-h-screen transition-[margin] duration-300 ease-out md:[margin-inline-start:var(--sidebar-width,18rem)]"
      >
        {children}
      </main>
    </div>
  )
}
