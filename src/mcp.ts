import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio.js";

import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface SSEMcpConnection {
  url: URL;
}
export type StdioMcpConnection = StdioServerParameters;
export type InMemoryMcpConnection = Server;
export type McpConnection = SSEMcpConnection | StdioMcpConnection | InMemoryMcpConnection;

/**
 * Connects to the MCP servers and returns the client transport.
 *
 * @throws Error if the MCP server configuration is invalid.
 */
export async function connectMcp<const T extends Record<string, McpConnection>>(props: {
  adapter: Client;
  mcpServers: T;
  envMapper: Record<string, string>;
  env: Record<string, keyof T>;
}) {
  const transports = await Promise.all(Object.entries(props.mcpServers).map(async ([name, setting]) => {
    // InMemory
    if (setting instanceof Server) {
      const env = extractEnvFromName(name, props.env, props.envMapper);
      Object.assign(process.env, env);
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
      const env = extractEnvFromName(name, props.env, props.envMapper);

      return new StdioClientTransport({
        ...setting,
        env: Object.keys(env).length !== 0 ? env : undefined,
      });
    }

    setting satisfies never;
    throw new Error(`Invalid MCP server configuration: ${name}\n${JSON.stringify(setting, null, 2)}`);
  }));

  for (const transport of transports) {
    await props.adapter.connect(transport).catch((e) => {
      console.error(e);
      throw e;
    });
  }
}

/**
 * Extracts the environment variables from the name.
 *
 * @param name - The name of the MCP server.
 * @param env - The environment variables. { ENV_KEY: "ENV_TARGET" }
 * ENV_TARGET is the target environment variable name, so example: "slack", "notion", "github", etc.
 * @param envMapper - The environment variable mapper. { ENV_KEY: "ENV_VALUE" }
 * ENV_VALUE is the value of the environment variable, so example: "gh_12309wqje123", "nt_12309wqje123", etc.
 * @returns The environment variables.
 */
function extractEnvFromName<const T extends Record<string, McpConnection>>(name: string, env: Record<string, keyof T>, envMapper: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(env)
      .filter(([, value]) => value === name)
      .map(([key]) => [key, envMapper[key]]),
  );
}
