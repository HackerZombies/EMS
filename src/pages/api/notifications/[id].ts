// pages/api/notifications/[id].ts
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    // Mark as read
    await prisma.notification.update({
      where: { id: id as string },
      data: { isRead: true },
    })
    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Error marking notification as read:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
