// pages/api/mobile/attendance/[action].ts

import { NextApiRequest, NextApiResponse } from 'next'
import Cors from 'nextjs-cors'
import jwt from 'jsonwebtoken'
import type { Geofence } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { reverseGeocodeFromMapbox } from '@/lib/mapbox'
import { haversineDistance } from '@/lib/utils'

// (Optional) If you have socket/notifications:
import { broadcastAttendanceUpdate } from '@/pages/api/socket'
import { createNotification } from '@/services/notificationService'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export default async function attendanceHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1) CORS
  await Cors(req, res, {
    methods: ['POST', 'OPTIONS'],
    origin: '*', // Restrict to specific domains in production
    optionsSuccessStatus: 200,
  })

  // 2) Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 3) Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // 4) Check action in query: /api/mobile/attendance/[action]
  const { action } = req.query
  if (action !== 'checkin' && action !== 'checkout') {
    return res.status(404).json({ message: 'Invalid action' })
  }

  // 5) Parse JWT from "Bearer <token>" in Authorization header
  const { authorization } = req.headers
  if (!authorization) {
    return res.status(401).json({ message: 'Missing Authorization header.' })
  }
  const token = authorization.split(' ')[1]
  if (!token) {
    return res
      .status(401)
      .json({ message: 'Invalid Authorization header format.' })
  }

  let decoded: any
  try {
    decoded = jwt.verify(token, JWT_SECRET)
  } catch (err) {
    console.error('JWT verify error:', err)
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }

  // 6) Extract fields from the request body
  const {
    date,
    checkInTime,
    checkOutTime,
    checkInLatitude,
    checkInLongitude,
    checkOutLatitude,
    checkOutLongitude,
  } = req.body

  // 7) Validate username + date
  const username = decoded.username
  if (!username || !date) {
    return res.status(400).json({ message: 'username and date are required' })
  }

  const parsedDate = new Date(date)
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: 'Invalid date format' })
  }

  try {
    let updatedAttendance = null

    // ------------------------------------------------------------------
    // CHECK-IN
    // ------------------------------------------------------------------
    if (action === 'checkin') {
      if (
        !checkInTime ||
        checkInLatitude === undefined ||
        checkInLongitude === undefined
      ) {
        return res
          .status(400)
          .json({ message: 'Missing required fields for check-in' })
      }

      // (A) Geofence enforcement
      const geofences = await prisma.geofence.findMany()
      const latNum = parseFloat(checkInLatitude)
      const lonNum = parseFloat(checkInLongitude)

      // Check if user is within at least ONE geofence
      const isInsideAnyGeofence = geofences.some((g: Geofence) => {
        const dist = haversineDistance(latNum, lonNum, g.latitude, g.longitude)
        return dist <= g.radius
      })

      if (!isInsideAnyGeofence) {
        return res
          .status(400)
          .json({ message: 'You are outside the permitted geofence area.' })
      }

      // (B) Check if user already checked in today
      const existing = await prisma.attendance.findUnique({
        where: {
          userUsername_date: {
            userUsername: username,
            date: parsedDate,
          },
        },
      })
      if (existing) {
        return res.status(400).json({ message: 'Already checked in today' })
      }

      // (C) Reverse-geocode the check-in address
      const checkInAddress = await reverseGeocodeFromMapbox(latNum, lonNum)

      // (D) Create new attendance record
      updatedAttendance = await prisma.attendance.create({
        data: {
          date: parsedDate,
          checkInTime: new Date(checkInTime),
          checkInLatitude: latNum,
          checkInLongitude: lonNum,
          checkInAddress,
          userUsername: username,
        },
        include: {
          user: {
            select: {
              username: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      })

      // (E) Optional notifications + broadcast
      if (updatedAttendance) {
        await createNotification({
          message: `User ${updatedAttendance.user.username} just checked in`,
          roleTargets: ['ADMIN', 'HR'],
          targetUrl: `/hr/attendance?recordId=${updatedAttendance.id}`,
        })
        broadcastAttendanceUpdate(updatedAttendance)
      }
    }

    // ------------------------------------------------------------------
    // CHECK-OUT
    // ------------------------------------------------------------------
    if (action === 'checkout') {
      if (
        !checkOutTime ||
        checkOutLatitude === undefined ||
        checkOutLongitude === undefined
      ) {
        return res
          .status(400)
          .json({ message: 'Missing required fields for check-out' })
      }

      // (A) Geofence enforcement
      const geofences = await prisma.geofence.findMany()
      const latNum = parseFloat(checkOutLatitude)
      const lonNum = parseFloat(checkOutLongitude)

      const isInsideAnyGeofence = geofences.some((g: Geofence) => {
        const dist = haversineDistance(latNum, lonNum, g.latitude, g.longitude)
        return dist <= g.radius
      })

      if (!isInsideAnyGeofence) {
        return res
          .status(400)
          .json({ message: 'You are outside the permitted geofence area.' })
      }

      // (B) Must have an existing check-in
      const attendance = await prisma.attendance.findUnique({
        where: {
          userUsername_date: {
            userUsername: username,
            date: parsedDate,
          },
        },
      })
      if (!attendance) {
        return res
          .status(400)
          .json({ message: 'No check-in record found for today' })
      }
      if (attendance.checkOutTime) {
        return res.status(400).json({ message: 'Already checked out today' })
      }

      // (C) Reverse-geocode the check-out address
      const checkOutAddress = await reverseGeocodeFromMapbox(latNum, lonNum)

      // (D) Update the existing record
      updatedAttendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOutTime: new Date(checkOutTime),
          checkOutLatitude: latNum,
          checkOutLongitude: lonNum,
          checkOutAddress,
        },
        include: {
          user: {
            select: {
              username: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      })

      // (E) Optional notifications + broadcast
      if (updatedAttendance) {
        await createNotification({
          message: `User ${updatedAttendance.user.username} just checked out`,
          roleTargets: ['ADMIN', 'HR'],
          targetUrl: `/hr/attendance?recordId=${updatedAttendance.id}`,
        })
        broadcastAttendanceUpdate(updatedAttendance)
      }
    }

    // 8) Return updated record
    return res.status(200).json(updatedAttendance)
  } catch (error) {
    console.error('Attendance handler error:', error)
    return res.status(500).json({ message: 'Server error' })
  }
}
