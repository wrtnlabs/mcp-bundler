import http from "node:http";

import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

import { createServer } from "./server";

export async function startSSEServer(options: { name: string; version: string; port: number; adapter: Client }) {
  const sessions = new Map<string, SSEServerTransport>();
  const handler = getHttpHandler({ name: options.name, version: options.version, port: options.port, sessions, adapter: options.adapter });
  // eslint-disable-next-line ts/no-misused-promises
  const httpServer = http.createServer(handler);

  httpServer.listen(options.port, () => {
    const address = httpServer.address();
    if (address === null) {
      throw new Error("Could not bind server socket");
    }

    const url = (() => {
      if (typeof address === "string") {
        return address;
      }

      const resolvedPort = address.port;
      const resolvedHost = (() => {
        const host = address.family === "IPv4" ? address.address : `[${address.address}]`;
        if (host === "0.0.0.0" || host === "[::]") {
          return "localhost";
        }
        return host;
      })();

      return `http://${resolvedHost}:${resolvedPort}`;
    })();

    console.log(`Listening on ${url}`);
    console.log("Put this in your client config:");
    console.log(JSON.stringify({
      mcpServers: {
        calculator: {
          url: `${url}/sse`,
        },
      },
    }, undefined, 2));
  });

  return httpServer;
}
export function getHttpHandler(options: { name: string; version: string; port: number; sessions: Map<string, SSEServerTransport>; adapter: Client }) {
  return async (req: http.IncomingMessage, res: http.ServerResponse) => {
    switch (req.method) {
      case "GET":{
        const transport = new SSEServerTransport("/sse", res);
        options.sessions.set(transport.sessionId, transport);
        const server = createServer({
          name: options.name,
          version: options.version,
          adapter: options.adapter,
        });
        res.on("close", () => {
          options.sessions.delete(transport.sessionId);
          server.close().catch(e => console.error(e));
        });
        await server.connect(transport);
        return;
      }
      case "POST": {
        const searchParams = new URL(`http://localhost${req.url}`).searchParams;
        const sessionId = searchParams.get("sessionId");
        if (sessionId === null) {
          res.statusCode = 400;
          res.end("Missing sessionId");
          return;
        }
        const transport = options.sessions.get(sessionId);
        if (transport == null) {
          res.statusCode = 404;
          res.end("Session not found");
          return;
        }

        await transport.handlePostMessage(req, res);
        return;
      }
      case undefined:
      default:
        res.statusCode = 405;
        res.end("Method not allowed");
    }
  };
}
