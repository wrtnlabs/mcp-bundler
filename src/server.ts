import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

export function createServer(options: { name: string; version: string; adapter: Client }) {
  const server = new Server({
    name: options.name,
    version: options.version,
  }, {
    capabilities: { tools: {} },
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = await options.adapter.listTools();
    return tools;
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const result = await options.adapter.callTool(request.params);
      return result;
    }
    catch (error) {
      return {
        content: [{ type: "text", text: String(error) }],
        isError: true,
      };
    }
  });

  const oldClose = server.close.bind(server);
  server.close = async () => {
    await oldClose();
  };

  return server;
}
