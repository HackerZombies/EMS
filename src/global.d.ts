// src/global.d.ts

import { WebSocketServer, WebSocket } from 'ws';

// Extend the global interface to include your custom properties.
declare global {
  // By default, globalThis has no custom properties,
  // so we declare them here explicitly:

  var wss: WebSocketServer | undefined; // The WebSocket server
}

// If you're using modules (which you are in Next.js),
// make sure the file is treated as a module:
export {};
