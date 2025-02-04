// src/types/next-websocket.d.ts

import { WebSocketServer } from 'ws'
import type { Server as HTTPServer } from 'http'
import type { Socket } from 'net'

declare module 'net' {
  interface Socket {
    server?: HTTPServer & {
      wss?: WebSocketServer
    }
  }
}

declare module 'http' {
  interface Server {
    wss?: WebSocketServer
  }
}
