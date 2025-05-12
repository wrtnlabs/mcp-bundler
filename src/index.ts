import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";

import type { McpConnection } from "./mcp";

import { connectMcp } from "./mcp";
import { buildCli } from "./cli";
import { createServer } from "./server";

interface Props<T extends Record<string, McpConnection>> {
  name: string;
  version: string;
  mcpServers: T;
}

export function bundler<const T extends Record<string, McpConnection>>(props: Props<T>): {
  run: () => void;
  createServer: (envList: Record<string, string>) => Promise<Server>;
} {
  return {
    run: () => {
      buildCli({
        name: props.name,
        version: props.version,
        mcpServers: props.mcpServers,
      }).parse(process.argv);
    },
    createServer: async (envList: Record<string, string>) => {
      const adapter = new Client({
        name: props.name,
        version: props.version,
      });
      const env = {
        ...process.env,
        ...envList,
      } as Record<string, string>;

      await connectMcp({
        adapter,
        mcpServers: props.mcpServers,
        externalEnv: env,
      });

      return createServer({
        name: props.name,
        version: props.version,
        adapter,
      });
    },
  };
}

export { RequiredEnv, OptionalEnv } from "./mcp";