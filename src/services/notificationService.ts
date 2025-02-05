// services/notificationService.ts
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"  // If your roles come from Prisma's generated types

interface CreateNotificationArgs {
  message: string
  roleTargets?: string[] // or UserRole[]
  recipientUsername?: string
  targetUrl?: string
}

/**
 * Creates a Notification record, then generates
 * "UserNotification" pivot rows for each relevant user
 * so each user has an independent isRead status.
 */
export async function createNotification({
  message,
  roleTargets,
  recipientUsername,
  targetUrl,
}: CreateNotificationArgs) {
  // If your Prisma schema has: roleTargets UserRole[]
  // we cast the array from string[] -> UserRole[] 
  // or do a more robust validation/conversion.
  const castedRoleTargets = roleTargets 
    ? (roleTargets as UserRole[])
    : undefined

  // 1) Create the base notification record
  const notification = await prisma.notification.create({
    data: {
      message,
      targetUrl,
      recipientUsername,
      // No isRead field here, as we track read status in userNotification pivot
      // If your schema says roleTargets: UserRole[] or String[]:
      roleTargets: castedRoleTargets,
    },
  })

  // 2) Identify which users get this notification
  let userIds: string[] = []

  // If a single user is specified
  if (recipientUsername) {
    const user = await prisma.user.findUnique({
      where: { username: recipientUsername },
      select: { id: true },
    })
    if (user?.id) {
      userIds.push(user.id)
    }
  }

  // If roles are specified (e.g. ["ADMIN", "HR"]) or "EVERYONE"
  if (roleTargets && roleTargets.length > 0) {
    if (roleTargets.includes("EVERYONE")) {
      // Broadcast to all
      const allUsers = await prisma.user.findMany({ select: { id: true } })
      userIds.push(...allUsers.map((u) => u.id))
    } else {
      // find users whose role is in roleTargets
      const matchedUsers = await prisma.user.findMany({
        where: {
          role: { in: castedRoleTargets }, // if your user.role is also a UserRole
        },
        select: { id: true },
      })
      userIds.push(...matchedUsers.map((u) => u.id))
    }
  }

  // 3) Remove duplicates (use Array.from + new Set)
  userIds = Array.from(new Set(userIds))

  // 4) Create pivot entries (userNotification) for each user
  //    'userNotification' property requires Prisma to be regenerated
  //    (npx prisma generate) if it doesn't exist in your client
  if (userIds.length > 0) {
    await prisma.userNotification.createMany({
      data: userIds.map((uid) => ({
        userId: uid,
        notificationId: notification.id,
        // isRead is default(false) in the model
      })),
    })
  }

  return notification
}
