// pages/api/mobile/attendance/all.ts
import { NextApiRequest, NextApiResponse } from 'next'
import Cors from 'nextjs-cors'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export default async function userAttendanceHistoryHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1) CORS
  await Cors(req, res, {
    methods: ['GET', 'OPTIONS'],
    origin: '*',
    optionsSuccessStatus: 200,
  })

  // 2) Handle OPTIONS
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

  // 5) Parse pagination params
  const page = parseInt((req.query.page as string) || '1', 10)
  const limit = parseInt((req.query.limit as string) || '10', 10)

  // Validate page/limit
  if (page < 1 || limit < 1) {
    return res.status(400).json({ message: 'Invalid pagination parameters' })
  }

  // 6) Calculate skip/take
  const skip = (page - 1) * limit
  const take = limit

  try {
    // 7) Fetch attendance records
    const attendances = await prisma.attendance.findMany({
      where: {
        userUsername: username,
      },
      orderBy: {
        date: 'desc',
      },
      skip,
      take,
    })

    // 8) (Optional) total count
    // const totalRecords = await prisma.attendance.count({
    //   where: { userUsername: username },
    // })

    return res.status(200).json({
      attendances,
      // totalRecords,
    })
  } catch (err) {
    console.error('Error fetching attendance records:', err)
    return res.status(500).json({ message: 'Server error' })
  }
}
