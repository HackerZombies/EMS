// src/components/NotificationCard.tsx
"use client"

import { Bell } from "lucide-react"

interface NotificationListCardProps {
  title: string
  time: string
  isNew?: boolean
  onClick?: () => void
  onClose?: () => void
}

export function NotificationListCard({
  title,
  time,
  isNew,
  onClick,
  onClose,
}: NotificationListCardProps) {
  return (
    <div
      onClick={onClick}
      className="
        cursor-pointer w-full max-w-full
        bg-white/80 backdrop-blur-md shadow-lg rounded-2xl
        overflow-hidden border border-gray-200 mb-2
        hover:shadow-xl transition-shadow
      "
    >
      <div className="px-4 py-3 flex items-center space-x-3 relative">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Bell className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 mb-0.5">
            {title}
          </p>
          <p className="text-xs text-gray-600">
            {new Date(time).toLocaleString()}
          </p>
        </div>

        {/* "New" badge */}
        {isNew && (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold text-primary bg-primary/10 rounded mr-2">
            New
          </span>
        )}

        {/* Close button */}
        {onClose && (
          <button
            onClick={(e) => {
              e.stopPropagation() // don't trigger onClick
              onClose()
            }}
            className="text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors"
            aria-label="Close notification"
          >
            Close
          </button>
        )}
      </div>
    </div>
  )
}
