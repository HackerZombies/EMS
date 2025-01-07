import { Server as HTTPServer } from 'http';
import { WebSocketServer } from 'ws';

declare module 'net' {
  interface Socket {
    server?: HTTPServer;
  }
}

declare module 'http' {
  interface Server {
    wss?: WebSocketServer;
  }
}
