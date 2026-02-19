import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';

export function setupHttpProxy() {
  const target = `${config.ORKET_API_URL.replace(/\/+$/, '')}/v1`;

  return createProxyMiddleware({
    target,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req) => {
        proxyReq.setHeader('X-API-Key', config.ORKET_API_KEY);

        // Express JSON middleware consumes the incoming stream.
        // Re-serialize parsed body for proxied POST/PATCH/PUT requests.
        const body = (req as { body?: unknown }).body;
        if (!body || typeof body !== 'object') return;

        const bodyData = JSON.stringify(body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      },
    },
  });
}
