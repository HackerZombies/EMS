// services/notificationService.ts
import { prisma } from "@/lib/prisma"

interface CreateNotificationArgs {
  message: string
  roleTargets?: string[]
  recipientUsername?: string
  targetUrl?: string  // add this
}

export async function createNotification({
  message,
  roleTargets,
  recipientUsername,
  targetUrl,
}: CreateNotificationArgs) {
  return prisma.notification.create({
    data: {
      message,
      isRead: false,
      roleTargets,
      recipientUsername,
      // set the link
      targetUrl,
    },
  })
}
