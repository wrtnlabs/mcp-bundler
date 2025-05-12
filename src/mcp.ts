import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio.js";

import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

export const RequiredEnv = Symbol("_mcp_bundler_required_env");
//            ^?
export const OptionalEnv = Symbol("_mcp_bundler_optional_env");
export interface SSEMcpConnection {
  url: URL;
}
export type StdioMcpConnection = Omit<StdioServerParameters, "env"> & {
  env?: Record<string, typeof RequiredEnv | typeof OptionalEnv | string>;
};

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
  externalEnv: Record<string, string>;
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
      const env = extractEnvFromName({
        env: setting.env ?? {},
        externalEnv: props.externalEnv,
      });

      Object.assign(env, process.env);
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
 * @param props - The properties.
 * @param props.env - The environment variables written by hard coding.
 * @param props.externalEnv - The environment variables. { ENV_KEY: "ENV_VALUE" }
 * ENV_VALUE is the value of the environment variable, so example: "gh_12309wqje123", "nt_12309wqje123", etc.
 * @returns The environment variables.
 */
function extractEnvFromName(props: {
  env: Record<string, typeof RequiredEnv | typeof OptionalEnv | string>;
  externalEnv: Record<string, string>;
}) {
  const envEntries = Object.entries(props.env);
  const defaultEnv = envEntries.filter(([, value]) => typeof value === "string") as [string, string][];
  const requiredEnv = envEntries.filter(([, value]) => value === RequiredEnv).map(([key]) => [key, props.externalEnv[key]] as const);
  const optionalEnv = envEntries.filter(([, value]) => value === OptionalEnv).map(([key]) => [key, props.externalEnv[key]] as const);

  requiredEnv.forEach(([key, value]) => {
    if (value === undefined) {
      console.warn(`Required environment variable ${key} is not set.`);
    }
  });

  return {
    ...Object.fromEntries(defaultEnv),
    ...Object.fromEntries(requiredEnv),
    ...Object.fromEntries(optionalEnv),
  };
}
