// src/pages/api/mobile/attendance/[action].ts
import { NextApiRequest, NextApiResponse } from 'next';
import Cors from 'nextjs-cors';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export default async function attendanceHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1) CORS
  await Cors(req, res, {
    methods: ['POST', 'OPTIONS'],
    origin: '*', // Limit to your domain(s) in production
    optionsSuccessStatus: 200,
  });

  // 2) Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3) Only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 4) Check `action`: /api/mobile/attendance/[action] -> "checkin"/"checkout"
  const { action } = req.query;
  if (action !== 'checkin' && action !== 'checkout') {
    return res.status(404).json({ message: 'Invalid action' });
  }

  // 5) Parse JWT from Authorization: "Bearer <token>"
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).json({ message: 'Missing Authorization header.' });
  }
  const token = authorization.split(' ')[1];
  if (!token) {
    return res
      .status(401)
      .json({ message: 'Invalid Authorization header format.' });
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error('JWT verify error:', err);
    return res.status(401).json({ message: 'Invalid token.' });
  }

  // 6) Extract fields from the body
  const {
    date,
    checkInTime,
    checkOutTime,
    checkInLatitude,
    checkInLongitude,
    checkOutLatitude,
    checkOutLongitude,
  } = req.body;

  // 7) Ensure username + date
  const username = decoded.username;
  if (!username || !date) {
    return res.status(400).json({ message: 'username and date are required' });
  }
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: 'Invalid date format' });
  }

  try {
    let updatedAttendance = null;

    // 8) checkin
    if (action === 'checkin') {
      if (
        !checkInTime ||
        checkInLatitude === undefined ||
        checkInLongitude === undefined
      ) {
        return res
          .status(400)
          .json({ message: 'Missing required fields for check-in' });
      }

      // Already checked in?
      const existing = await prisma.attendance.findUnique({
        where: {
          userUsername_date: {
            userUsername: username,
            date: parsedDate,
          },
        },
      });
      if (existing) {
        return res.status(400).json({ message: 'Already checked in today' });
      }

      // Create new attendance record
      updatedAttendance = await prisma.attendance.create({
        data: {
          date: parsedDate,
          checkInTime: new Date(checkInTime),
          checkInLatitude: parseFloat(checkInLatitude),
          checkInLongitude: parseFloat(checkInLongitude),
          userUsername: username,
        },
      });
    }

    // 9) checkout
    if (action === 'checkout') {
      if (
        !checkOutTime ||
        checkOutLatitude === undefined ||
        checkOutLongitude === undefined
      ) {
        return res
          .status(400)
          .json({ message: 'Missing required fields for check-out' });
      }

      // Must have an existing checkin for the same date
      const attendance = await prisma.attendance.findUnique({
        where: {
          userUsername_date: {
            userUsername: username,
            date: parsedDate,
          },
        },
      });
      if (!attendance) {
        return res
          .status(400)
          .json({ message: 'No check-in record found for today' });
      }
      if (attendance.checkOutTime) {
        return res.status(400).json({ message: 'Already checked out today' });
      }

      // Update the existing record
      updatedAttendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOutTime: new Date(checkOutTime),
          checkOutLatitude: parseFloat(checkOutLatitude),
          checkOutLongitude: parseFloat(checkOutLongitude),
        },
      });
    }

    // 10) Confirm success
    if (!updatedAttendance) {
      return res.status(500).json({ message: 'Could not update attendance' });
    }

    return res.status(200).json({
      message: action === 'checkin'
        ? 'Check-In successful'
        : 'Check-Out successful',
    });
  } catch (error) {
    console.error(`Error in attendance ${action}:`, error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
