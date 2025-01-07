// src/pages/api/socket.ts

import WebSocket, { WebSocketServer } from 'ws'; // Corrected import
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma'; // Import Prisma client
import { Server as HTTPServer } from 'http';

// 2. Initialize WebSocketServer only once
let wss: WebSocketServer | undefined;

// 3. WebSocket handler
const wsHandler = (req: NextApiRequest, res: NextApiResponse) => {
  const server = req.socket.server as HTTPServer; // Type assertion with augmented properties

  if (server.wss) {
    console.log('WebSocket server already running');
    res.end();
    return;
  }

  console.log('Initializing WebSocket server');

  // 4. Initialize the WebSocket server with the HTTP server
  wss = new WebSocketServer({ server });

  server.wss = wss; // Attach the WebSocketServer instance to the HTTP server

  // 5. Handle new client connections
  wss.on('connection', async (ws: WebSocket) => {
    console.log('Client connected');
    ws.send(JSON.stringify({ type: 'serverReady' })); // Send serverReady message

    // 6. Handle incoming messages from clients
    ws.on('message', async (message: WebSocket.Data) => { // No more TypeScript error
      let parsedMessage: any;

      try {
        // Ensure the message is a string before parsing
        const messageStr = typeof message === 'string' ? message : message.toString();
        parsedMessage = JSON.parse(messageStr);
      } catch (error) {
        console.error('Invalid JSON received:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON format' }));
        return;
      }

      // Handle different message types
      if (parsedMessage.type === 'request-all-attendance') {
        console.log('Received request for all attendance data');
        try {
          const allAttendance = await prisma.attendance.findMany({
            include: {
              user: {
                select: { username: true, firstName: true, lastName: true, role: true },
              },
            },
            orderBy: { date: 'desc' },
          });
          ws.send(JSON.stringify({ type: 'allAttendanceData', payload: allAttendance }));
        } catch (error) {
          console.error('Error fetching all attendance data:', error);
          ws.send(JSON.stringify({ type: 'error', message: 'Failed to fetch attendance data' }));
        }
      }
    });

    // 7. Handle client disconnections
    ws.on('close', () => {
      console.log('Client disconnected');
    });

    // 8. Handle WebSocket errors
    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });
  });

  console.log('WebSocket server started');
  res.end();
};

// 9. Broadcast attendance updates to all connected clients
export const broadcastAttendanceUpdate = (attendanceData: any) => {
  if (!wss) {
    console.log('WebSocket server not initialized');
    return;
  }
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'attendanceUpdate', payload: attendanceData }));
    }
  });
};

// 10. Disable Next.js body parsing for this API route
export const config = {
  api: {
    bodyParser: false,
  },
};

export default wsHandler;
