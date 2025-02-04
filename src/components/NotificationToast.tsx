// src/components/NotificationToast.tsx
"use client"

import { useRouter } from "next/router"
// If using Next.js App Router (v13+):
// import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Bell } from "lucide-react"
import { useState } from "react"

interface AnimatedNotificationToastProps {
  toastId: string
  message: string
  createdAt: string
  targetUrl?: string
  onOpen?: () => void   // Called when user clicks the whole toast
  onClose?: () => void  // Called when user clicks the Close button
}

export function AnimatedNotificationToast({
  toastId,
  message,
  createdAt,
  targetUrl,
  onOpen,
  onClose,
}: AnimatedNotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const router = useRouter()

  // If user clicks the entire toast, call onOpen & navigate (if any)
  const handleToastClick = () => {
    if (onOpen) onOpen()
    if (targetUrl) router.push(targetUrl)
  }

  // If user clicks the Close button, call onClose
  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation() // prevents also triggering handleToastClick
    setIsVisible(false)
    if (onClose) onClose()
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={toastId}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 0.3 }}
          onClick={handleToastClick}
          className="cursor-pointer w-full max-w-sm bg-white/80
                     backdrop-blur-md shadow-lg rounded-2xl overflow-hidden
                     border border-gray-200 mb-2"
        >
          <div className="px-4 py-3 flex items-center space-x-3">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div
                className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600
                           rounded-xl flex items-center justify-center"
              >
                <Bell className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
            </div>

            {/* Notification text */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 mb-0.5">
                {message}
              </p>
              <p className="text-xs text-gray-600">
                {new Date(createdAt).toLocaleString()}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={handleCloseClick}
              className="text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors"
              aria-label="Close notification"
            >
              Close
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
