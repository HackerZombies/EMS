// hooks/usePolledNotifications.ts
import { useEffect, useState } from 'react'

interface NotificationItem {
  id: string
  message: string
  createdAt: string
  // ...
}

export function usePolledNotifications(intervalMs = 10000) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function fetchNotifications() {
      try {
        setLoading(true)
        const res = await fetch('/api/notifications')
        if (!res.ok) {
          throw new Error('Failed to fetch notifications')
        }
        const data = await res.json()
        if (isMounted) {
          setNotifications(data.notifications || [])
          setLoading(false)
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Polling error:', err)
          setError(err.message)
          setLoading(false)
        }
      }
    }

    // Initial fetch
    fetchNotifications()

    // Poll every X ms
    const intervalId = setInterval(fetchNotifications, intervalMs)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [intervalMs])

  return { notifications, error, loading }
}
