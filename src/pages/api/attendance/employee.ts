// pages/api/attendance/employee.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow only GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  // Extract the username from query parameters
  const { username } = req.query

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required and must be a string' })
  }

  try {
    // Query all attendance records for the specified username
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        userUsername: username,
      },
      orderBy: {
        date: 'desc',
      },
      include: {
        // Include the related user details if needed
        user: true,
      },
    })

    // Return the records as JSON
    return res.status(200).json(attendanceRecords)
  } catch (error) {
    console.error('Error fetching employee attendance:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
