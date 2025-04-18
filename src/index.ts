import type { StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio.js";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

import { buildCli } from "./cli";
import { createServer } from "./server";

export interface SSEMcpConnection {
  url: URL;
}
export type StdioMcpConnection = StdioServerParameters;
export type InMemoryMcpConnection = Server;
export type McpConnection = SSEMcpConnection | StdioMcpConnection | InMemoryMcpConnection;

interface Props<T extends string> {
  name: string;
  version: string;
  mcpServers: Record<T, McpConnection>;
  env: Record<string, T>;
}

export async function bundler<T extends string>(props: Props<T>): Promise<{
  run: () => void;
  server: Server;
}> {
  const adapter = new Client({
    name: props.name,
    version: props.version,
  });
  await connectMcp({
    adapter,
    mcpServers: props.mcpServers,
  });

  const server = createServer({
    name: props.name,
    version: props.version,
    adapter,
  });
  return {
    run: () => {
      buildCli({
        name: props.name,
        version: props.version,
        adapter,
      }).parse(process.argv);
    },
    server,
  };
}

/**
 * Connects to the MCP servers and returns the client transport.
 *
 * @throws Error if the MCP server configuration is invalid.
 */
export async function connectMcp(props: {
  adapter: Client;
  mcpServers: Record<string, McpConnection>;
}) {
  const transports = await Promise.all(Object.entries(props.mcpServers).map(async ([name, setting]) => {
    // InMemory
    if (setting instanceof Server) {
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await setting.connect(serverTransport);
      return clientTransport;
    }

    // SSE
    if ("url" in setting) {
      return new SSEClientTransport(setting.url);
    }

    // Stdio
    if ("command" in setting) {
      return new StdioClientTransport(setting);
    }

    setting satisfies never;
    throw new Error(`Invalid MCP server configuration: ${name}\n${JSON.stringify(setting, null, 2)}`);
  }));

  for (const transport of transports) {
    await props.adapter.connect(transport);
  }
}
