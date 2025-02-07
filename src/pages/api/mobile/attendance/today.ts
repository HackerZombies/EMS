// pages/api/mobile/attendance/today.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export default async function todayAttendanceHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
  let decoded: any;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  const username = decoded.username;
  if (!username) {
    return res.status(400).json({ message: 'Missing username in token' });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find today's attendance record
  const attendance = await prisma.attendance.findUnique({
    where: {
      userUsername_date: {
        userUsername: username,
        date: today,
      },
    },
  });

  // Return an empty object or the times
  if (!attendance) {
    return res.status(200).json({ checkInTime: null, checkOutTime: null });
  }

  return res.status(200).json({
    checkInTime: attendance.checkInTime,
    checkOutTime: attendance.checkOutTime,
  });
}
