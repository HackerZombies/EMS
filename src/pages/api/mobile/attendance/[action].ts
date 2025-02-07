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
  // 1. Run CORS middleware
  await Cors(req, res, {
    methods: ['POST', 'OPTIONS'],
    origin: '*',
    optionsSuccessStatus: 200,
  });

  // 2. Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 4. Get the `action` from the URL: /api/mobile/attendance/[action]
  const { action } = req.query;
  if (action !== 'checkin' && action !== 'checkout') {
    return res.status(404).json({ message: 'Invalid action' });
  }

  // 5. Verify token from Authorization header
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).json({ message: 'Missing Authorization header.' });
  }
  const token = authorization.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Invalid Authorization header format.' });
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error('JWT verify error:', err);
    return res.status(401).json({ message: 'Invalid token.' });
  }

  // 6. Extract data from the body
  const {
    date,
    checkInTime,
    checkOutTime,
    checkInLatitude,
    checkInLongitude,
    checkOutLatitude,
    checkOutLongitude,
  } = req.body;

  // We can get the username from the token or from the body if you prefer:
  // e.g. const { username } = decoded;
  // or you can pass it in the body. Here we do from token:
  const username = decoded.username;

  if (!username || !date) {
    return res.status(400).json({ message: 'username and date are required' });
  }

  // Parse the date properly
  let parsedDate = new Date(date); // e.g. '2023-10-10'
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: 'Invalid date format' });
  }

  try {
    // 7. Attempt create / update in the DB
    let updatedAttendance = null;

    if (action === 'checkin') {
      // Check we have needed fields
      if (!checkInTime || checkInLatitude === undefined || checkInLongitude === undefined) {
        return res
          .status(400)
          .json({ message: 'Missing required fields for check-in' });
      }

      // See if there's already an attendance record for this date
      const existingAttendance = await prisma.attendance.findUnique({
        where: {
          userUsername_date: {
            userUsername: username,
            date: parsedDate,
          },
        },
      });

      if (existingAttendance) {
        return res.status(400).json({ message: 'Already checked in today' });
      }

      // Create a new record
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

    if (action === 'checkout') {
      if (!checkOutTime || checkOutLatitude === undefined || checkOutLongitude === undefined) {
        return res
          .status(400)
          .json({ message: 'Missing required fields for check-out' });
      }

      // Attempt to find existing record
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

      // Update the record
      updatedAttendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOutTime: new Date(checkOutTime),
          checkOutLatitude: parseFloat(checkOutLatitude),
          checkOutLongitude: parseFloat(checkOutLongitude),
        },
      });
    }

    if (!updatedAttendance) {
      return res.status(500).json({ message: 'Could not update attendance' });
    }

    // 8. Return success
    return res.status(200).json({
      message: `${action === 'checkin' ? 'Check-In' : 'Check-Out'} successful`,
    });
  } catch (error) {
    console.error(`Error in attendance ${action}:`, error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
