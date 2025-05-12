import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Command } from "commander";

import type { McpConnection } from "./mcp.js";

import { connectMcp } from "./mcp.js";
import { createServer } from "./server";
import { startSSEServer } from "./sse";

export function buildCli<T extends Record<string, McpConnection>>(props: { version: string; name: string; mcpServers: T }) {
  return new Command()
    .version(props.version)
    .name(props.name)
    .option("--port <port>", "Port to listen on for SSE transport.")
    .action(async (options: unknown) => {
      const adapter = new Client({
        name: props.name,
        version: props.version,
      });
      await connectMcp({
        adapter,
        mcpServers: props.mcpServers,
        externalEnv: process.env as Record<string, string>,
      });

      if (typeof options === "object" && options !== null && "port" in options && (typeof options.port === "string" || typeof options.port === "number")) {
        console.log(`This server is running on SSE (http://localhost:${options.port}/sse?sessionId=<sessionId>)`);
        await startSSEServer({
          port: +options.port,
          name: props.name,
          version: props.version,
          adapter,
        });
      }
      else {
        console.log("This server is running on stdio");
        const server = createServer({
          name: props.name,
          version: props.version,
          adapter,
        });
        const transport = new StdioServerTransport();
        await server.connect(transport);
      }
    });
}
