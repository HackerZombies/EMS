// pages/api/mobile/attendance/today.ts
import { NextApiRequest, NextApiResponse } from 'next'
import Cors from 'nextjs-cors'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export default async function todayAttendanceHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1) CORS
  await Cors(req, res, {
    methods: ['GET', 'OPTIONS'],
    origin: '*',
    optionsSuccessStatus: 200,
  })

  // 2) Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 3) Only GET
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // 4) Check Authorization header
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ message: 'No token provided' })
  }

  let decoded: any
  try {
    decoded = jwt.verify(token, JWT_SECRET)
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }

  const username = decoded.username
  if (!username) {
    return res.status(400).json({ message: 'Missing username in token' })
  }

  // 5) Construct "today" at midnight (server-time)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // NOTE: If your users are in different time zones, you might store everything in UTC
  // or pass a date from the client. Adjust accordingly.

  try {
    // 6) Find today's attendance record
    const attendance = await prisma.attendance.findUnique({
      where: {
        userUsername_date: {
          userUsername: username,
          date: today,
        },
      },
    })

    if (!attendance) {
      return res.status(200).json({ checkInTime: null, checkOutTime: null })
    }

    // 7) Return times
    return res.status(200).json({
      checkInTime: attendance.checkInTime,
      checkOutTime: attendance.checkOutTime,
    })
  } catch (err) {
    console.error('Error fetching today attendance:', err)
    return res.status(500).json({ message: 'Server error' })
  }
}
