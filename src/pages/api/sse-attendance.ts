// pages/api/sse-attendance.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Validate session
  const session = await getServerSession(req, res, authOptions);
  if (!session || !['HR', 'ADMIN'].includes(session.user?.role)) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  // POLLING MODE: If "poll" query parameter is present, return JSON data.
  if (req.query.poll) {
    const lastTimestamp = req.query.lastTimestamp ? new Date(req.query.lastTimestamp as string) : new Date(0);
    try {
      const newRecords = await prisma.attendance.findMany({
        where: {
          date: {
            gt: lastTimestamp,
          },
        },
        orderBy: { date: 'asc' },
        include: { user: true },
      });

      // Map records to a payload format.
      const payload = newRecords.map(record => ({
        id: record.id,
        date: record.date.toISOString(),
        checkInTime: record.checkInTime ? record.checkInTime.toISOString() : null,
        checkOutTime: record.checkOutTime ? record.checkOutTime.toISOString() : null,
        userUsername: record.userUsername, // Ensure userUsername is correctly fetched
      }));

      return res.status(200).json({ type: 'attendanceUpdate', payload });
    } catch (error) {
      console.error("Polling error:", error);
      return res.status(500).json({ message: "Error fetching attendance updates" });
    }
  }

  // SSE MODE: Otherwise, set up a Server-Sent Events connection.
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Send initial event to indicate the connection is established.
  res.write(`data: ${JSON.stringify({ type: 'serverReady', message: 'Connection established' })}\n\n`);

  // Keep track of the latest timestamp we've seen so far.
  let lastTimestamp = new Date();

  // Function to check for new attendance updates.
  const checkForUpdates = async () => {
    try {
      const newRecords = await prisma.attendance.findMany({
        where: {
          date: {
            gt: lastTimestamp,
          },
        },
        orderBy: { date: 'asc' },
        include: { user: true },
      });

      if (newRecords.length > 0) {
        newRecords.forEach(record => {
          if (record.date > lastTimestamp) {
            lastTimestamp = record.date;
          }
          const payload = {
            id: record.id,
            date: record.date.toISOString(),
            checkInTime: record.checkInTime ? record.checkInTime.toISOString() : null,
            checkOutTime: record.checkOutTime ? record.checkOutTime.toISOString() : null,
            userUsername: record.userUsername, // Ensure it's correctly sent
          };
          res.write(`data: ${JSON.stringify({ type: 'attendanceUpdate', payload })}\n\n`);
        });
      }
    } catch (error) {
      console.error("Error checking for updates:", error);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Error checking updates' })}\n\n`);
    }
  };

  // Poll for updates every 5 seconds.
  const intervalId = setInterval(checkForUpdates, 5000);

  // When the client disconnects, clear the polling interval.
  req.on('close', () => {
    clearInterval(intervalId);
    res.end();
  });
}
