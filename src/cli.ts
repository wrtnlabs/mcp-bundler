import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { program } from "commander";

import { createServer } from "./server";
import { startSSEServer } from "./sse";

export function buildCli(props: { version: string; name: string; adapter: Client }) {
  return program
    .version(props.version)
    .name(props.name)
    .option("--port <port>", "Port to listen on for SSE transport.")
    .action(async (options: unknown) => {
      if (typeof options === "object" && options !== null && "port" in options && (typeof options.port === "string" || typeof options.port === "number")) {
        console.log(`This server is running on SSE (http://localhost:${options.port}/sse?sessionId=<sessionId>)`);
        await startSSEServer({
          port: +options.port,
          name: props.name,
          version: props.version,
          adapter: props.adapter,
        });
      }
      else {
        console.log("This server is running on stdio");
        const server = createServer({
          name: props.name,
          version: props.version,
          adapter: props.adapter,
        });
        const transport = new StdioServerTransport();
        await server.connect(transport);
      }
    });
}
