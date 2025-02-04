// components/Notifications.tsx
import { usePolledNotifications } from '@/hooks/usePolledNotifications'

export default function Notifications() {
  const { notifications, loading, error } = usePolledNotifications(5000) // poll every 5s

  if (loading) return <div>Loading notifications...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h3>Latest Notifications</h3>
      <ul>
        {notifications.map((notif) => (
          <li key={notif.id}>
            {notif.message} - {new Date(notif.createdAt).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  )
}
