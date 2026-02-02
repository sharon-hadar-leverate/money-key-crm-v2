import { Header } from '@/components/layout/header'
import { getAllNotifications, getUnreadCount } from '@/actions/notifications'
import { NotificationsPageClient } from './notifications-page-client'

export default async function NotificationsPage() {
  // Parallel fetching (async-parallel rule)
  const [notificationsResult, unreadCount] = await Promise.all([
    getAllNotifications({ limit: 50 }),
    getUnreadCount(),
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
        />
      </div>
    </>
  )
}
