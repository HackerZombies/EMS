// src/pages/api/socket.ts

import WebSocket, { WebSocketServer } from 'ws'; // Import WebSocket
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma'; // Import Prisma client
import { Server as HTTPServer } from 'http';

// Singleton WebSocket Server
let wss: WebSocketServer | undefined;

const wsHandler = (req: NextApiRequest, res: NextApiResponse) => {
  const server = req.socket.server as HTTPServer; // Access underlying HTTP server

  // Prevent reinitializing the WebSocket server
  if (server.wss) {
    console.log('WebSocket server already initialized');
    res.end();
    return;
  }

  console.log('Initializing WebSocket server...');

  // Initialize WebSocket server
  wss = new WebSocketServer({ noServer: true });

  // Attach the WebSocket server to handle HTTP upgrade events
  server.on('upgrade', (req, socket, head) => {
    wss!.handleUpgrade(req, socket, head, (ws) => {
      wss!.emit('connection', ws, req);
    });
  });

  server.wss = wss; // Attach WebSocket server to the HTTP server

  // Handle WebSocket connections
  wss.on('connection', async (ws: WebSocket) => {
    console.log('Client connected');
    ws.send(JSON.stringify({ type: 'serverReady' })); // Notify client

    ws.on('message', async (message: WebSocket.Data) => {
      try {
        const parsedMessage = JSON.parse(
          typeof message === 'string' ? message : message.toString()
        );

        if (parsedMessage.type === 'request-all-attendance') {
          console.log('Received request for attendance data');

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
          } catch (dbError) {
            console.error('Error fetching attendance data:', dbError);
            ws.send(JSON.stringify({ type: 'error', message: 'Failed to fetch attendance data' }));
          }
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'Unknown request type' }));
        }
      } catch (error) {
        console.error('Invalid JSON received:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON format' }));
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      console.log('Client disconnected');
    });

    // Handle WebSocket errors
    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });
  });

  console.log('WebSocket server initialized');
  res.end();
};

// Broadcast attendance updates to all connected clients
export const broadcastAttendanceUpdate = (attendanceData: any) => {
  if (!wss) {
    console.error('WebSocket server is not initialized');
    return;
  }

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'attendanceUpdate', payload: attendanceData }));
    }
  });
};

// Disable body parsing for WebSocket API route
export const config = {
  api: {
    bodyParser: false,
  },
};

export default wsHandler;
