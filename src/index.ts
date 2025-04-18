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
  createServer: (envList: Record<string, string>) => Promise<Server>;
}> {
  return {
    run: () => {
      buildCli({
        name: props.name,
        version: props.version,
        mcpServers: props.mcpServers,
        env: props.env,
      }).parse(process.argv);
    },
    createServer: async (envList: Record<string, string>) => {
      const adapter = new Client({
        name: props.name,
        version: props.version,
      });
      await connectMcp({
        adapter,
        mcpServers: props.mcpServers,
        envMapper: props.env,
        env: envList,
      });

      return createServer({
        name: props.name,
        version: props.version,
        adapter,
      });
    },
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
  envMapper: Record<string, string>;
  env: Record<string, string>;
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
      return new StdioClientTransport({
        ...setting,
        env: extractEnvFromName(name, props.env, props.envMapper),
      });
    }

    setting satisfies never;
    throw new Error(`Invalid MCP server configuration: ${name}\n${JSON.stringify(setting, null, 2)}`);
  }));

  for (const transport of transports) {
    await props.adapter.connect(transport);
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
const extractEnvFromName = (name: string, env: Record<string, string>, envMapper: Record<string, string>) => {
  return Object.fromEntries(Object.entries(env).filter(([, value]) => value === name).map(([key]) => [key, envMapper[key]]));
}
