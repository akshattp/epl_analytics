#!/usr/bin/env node
/**
 * EPL Unified Single-Port Reverse Proxy Gateway (Zero External Dependencies)
 * Exposes Next.js (:3000) + FastAPI HTTP & WebSockets (:8000) over a single port (:8080)
 * so a single ngrok tunnel (`ngrok http 8080`) serves the entire EPL platform seamlessly,
 * including live 6-owner WebSocket bidding over WSS.
 */
import http from "node:http";
import net from "node:net";

const GATEWAY_PORT = Number(process.env.GATEWAY_PORT || 8080);
const FRONTEND_HOST = "127.0.0.1";
const FRONTEND_PORT = 3000;
const BACKEND_HOST = "127.0.0.1";
const BACKEND_PORT = 8000;

function pickTarget(url = "/") {
  if (url.startsWith("/api/") || url === "/docs" || url === "/openapi.json") {
    return { host: BACKEND_HOST, port: BACKEND_PORT };
  }
  return { host: FRONTEND_HOST, port: FRONTEND_PORT };
}

const server = http.createServer((req, res) => {
  const target = pickTarget(req.url);
  const proxyReq = http.request(
    {
      hostname: target.host,
      port: target.port,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `${target.host}:${target.port}`,
        "x-forwarded-host": req.headers.host || "",
        "x-forwarded-proto": req.headers["x-forwarded-proto"] || "http",
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    }
  );

  proxyReq.on("error", (err) => {
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "application/json" });
    }
    res.end(JSON.stringify({ error: "Upstream unavailable", detail: err.message }));
  });

  req.pipe(proxyReq, { end: true });
});

// Transparent raw TCP pipe for WebSocket Upgrade requests (wss:// -> ws://127.0.0.1:8000)
server.on("upgrade", (req, clientSocket, head) => {
  const target = pickTarget(req.url);
  const upstream = net.connect(target.port, target.host, () => {
    const headerLines = [`${req.method} ${req.url} HTTP/${req.httpVersion}`];
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      const k = req.rawHeaders[i];
      const v = req.rawHeaders[i + 1];
      if (k.toLowerCase() === "host") {
        headerLines.push(`Host: ${target.host}:${target.port}`);
      } else {
        headerLines.push(`${k}: ${v}`);
      }
    }
    upstream.write(headerLines.join("\r\n") + "\r\n\r\n");
    if (head && head.length) upstream.write(head);
    upstream.pipe(clientSocket);
    clientSocket.pipe(upstream);
  });

  upstream.on("error", () => clientSocket.destroy());
  clientSocket.on("error", () => upstream.destroy());
});

server.listen(GATEWAY_PORT, "127.0.0.1", () => {
  console.log(
    `[EPL Gateway] Listening on http://127.0.0.1:${GATEWAY_PORT} -> Frontend(:${FRONTEND_PORT}) + Backend HTTP/WS(:${BACKEND_PORT})`
  );
});
