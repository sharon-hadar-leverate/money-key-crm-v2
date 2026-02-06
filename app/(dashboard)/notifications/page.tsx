import { Header } from '@/components/layout/header'
import { getAllNotifications, getUnreadCount, getDistinctActors, getDistinctNotificationLeads } from '@/actions/notifications'
import { NotificationsPageClient } from './notifications-page-client'

export default async function NotificationsPage() {
  // Parallel fetching (async-parallel rule)
  const [notificationsResult, unreadCount, actors, leads] = await Promise.all([
    getAllNotifications({ limit: 50 }),
    getUnreadCount(),
    getDistinctActors(),
    getDistinctNotificationLeads(),
  ])

  return (
    <>
      <Header
        title="התראות"
        subtitle={`${unreadCount} התראות שלא נקראו`}
      />
      <div className="p-6">
        <NotificationsPageClient
          initialNotifications={notificationsResult.notifications}
          initialUnreadCount={unreadCount}
          initialTotal={notificationsResult.total}
          actors={actors}
          leads={leads}
        />
      </div>
    </>
  )
}
