import { Server } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { parse } from 'url';
import { config } from '../config';

export function setupWsProxy(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const { pathname } = parse(req.url || '');
    if (pathname === '/ws/events') {
      wss.handleUpgrade(req, socket, head, (clientWs) => {
        // Connect to upstream Orket WS
        const wsUrl = config.ORKET_API_URL.replace(/^http/, 'ws') + '/ws/events';
        const upstream = new WebSocket(wsUrl, {
          headers: { 'X-API-Key': config.ORKET_API_KEY },
        });

        upstream.on('open', () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'connected' }));
          }
        });

        upstream.on('message', (data) => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(data.toString());
          }
        });

        upstream.on('close', () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.close();
          }
        });

        upstream.on('error', () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.close();
          }
        });

        clientWs.on('close', () => {
          if (upstream.readyState === WebSocket.OPEN) {
            upstream.close();
          }
        });

        clientWs.on('error', () => {
          if (upstream.readyState === WebSocket.OPEN) {
            upstream.close();
          }
        });
      });
    } else {
      socket.destroy();
    }
  });
}
