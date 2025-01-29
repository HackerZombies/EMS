import WebSocket, { WebSocketServer } from 'ws';
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { IncomingMessage } from 'http'; // Import IncomingMessage from Node.js

let wss: WebSocketServer | undefined;

const wsHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  const server = req.socket.server;

  if (!server) {
    return res.status(500).json({ message: 'Server not initialized' });
  }

  if (server.wss) {
    console.log('WebSocket server already initialized');
    res.end();
    return;
  }

  console.log('Initializing WebSocket server...');
  wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', async (req, socket, head) => {
    // Ensure `req` includes `cookies`
    const enhancedReq = req as IncomingMessage & { cookies: Record<string, string> };
    enhancedReq.cookies = enhancedReq.cookies || {};

    try {
      const session = await getServerSession({ req: enhancedReq, res, ...authOptions });
      if (!session || !['HR', 'ADMIN'].includes(session.user?.role)) {
        console.log('Unauthorized WebSocket connection attempt');
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      wss!.handleUpgrade(req, socket, head, (ws) => {
        wss!.emit('connection', ws, req, session);
      });
    } catch (error) {
      console.error('Error during session validation:', error);
      socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
      socket.destroy();
    }
  });

  server.wss = wss;

  wss.on('connection', (ws: WebSocket, req: IncomingMessage, session: any) => {
    console.log(`WebSocket connected: ${session.user.username}`);
    ws.send(JSON.stringify({ type: 'serverReady' }));

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

    ws.on('close', () => {
      console.log('Client disconnected');
    });

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

export const config = {
  api: {
    bodyParser: false,
  },
};

export default wsHandler;
