// pages/api/socket.ts

import WebSocket, { WebSocketServer } from 'ws'
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { IncomingMessage } from 'http'
import cookie from 'cookie' // Import cookie parsing library

let wss: WebSocketServer | undefined

const wsHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  const server = req.socket.server

  if (!server) {
    return res.status(500).json({ message: 'Server not initialized' })
  }

  // If we've already attached a WebSocket server, skip re-initializing
  if (server.wss) {
    console.log('WebSocket server already initialized')
    res.end()
    return
  }

  console.log('Initializing WebSocket server...')
  wss = new WebSocketServer({ noServer: true })

  // Attach an 'upgrade' event to handle the WebSocket handshake
  server.on('upgrade', async (upgradeReq, socket, head) => {
    try {
      // Parse cookies using the cookie library
      const cookies = cookie.parse(upgradeReq.headers.cookie || '') as Record<string, string>;
      console.log('Upgrade request cookies:', cookies);

      // Enhance the request to include parsed cookies
      const enhancedReq = upgradeReq as IncomingMessage & {
        cookies: Record<string, string>
      }
      enhancedReq.cookies = cookies

      // Retrieve session using getServerSession
      const session = await getServerSession({
        req: enhancedReq,
        res,
        ...authOptions,
      })
      console.log('Session retrieved:', session)

      // Allow only HR/ADMIN to connect
      if (!session || !['HR', 'ADMIN'].includes(session.user?.role)) {
        console.log('Unauthorized WebSocket connection attempt')
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
        socket.destroy()
        return
      }

      // Complete the upgrade process
      wss!.handleUpgrade(upgradeReq, socket, head, (ws) => {
        wss!.emit('connection', ws, upgradeReq, session)
      })
    } catch (error) {
      console.error('Error during session validation:', error)
      socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n')
      socket.destroy()
    }
  })

  // Attach the WebSocket server to the HTTP server instance
  server.wss = wss

  // Handle new WebSocket connections
  wss.on('connection', (ws: WebSocket, req: IncomingMessage, session: any) => {
    console.log(`WebSocket connected: ${session.user.username}`)
    // Inform client that server is ready
    ws.send(JSON.stringify({ type: 'serverReady' }))

    // Handle incoming messages from the client
    ws.on('message', async (message: WebSocket.Data) => {
      try {
        const parsedMessage = JSON.parse(
          typeof message === 'string' ? message : message.toString()
        )

        if (parsedMessage.type === 'request-all-attendance') {
          console.log('Received request for attendance data')
          try {
            const allAttendance = await prisma.attendance.findMany({
              include: {
                user: {
                  select: { username: true, firstName: true, lastName: true, role: true },
                },
              },
              orderBy: { date: 'desc' },
            })

            ws.send(JSON.stringify({ type: 'allAttendanceData', payload: allAttendance }))
          } catch (dbError) {
            console.error('Error fetching attendance data:', dbError)
            ws.send(
              JSON.stringify({ type: 'error', message: 'Failed to fetch attendance data' })
            )
          }
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'Unknown request type' }))
        }
      } catch (error) {
        console.error('Invalid JSON received:', error)
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON format' }))
      }
    })

    ws.on('close', () => {
      console.log('Client disconnected')
    })

    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error)
    })
  })

  console.log('WebSocket server initialized')
  res.end()
}

/**
 * Broadcast attendance updates to all connected clients
 */
export const broadcastAttendanceUpdate = (attendanceData: any) => {
  if (!wss) {
    console.error('WebSocket server is not initialized')
    return
  }

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'attendanceUpdate', payload: attendanceData }))
    }
  })
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default wsHandler
