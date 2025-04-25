import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";

import type { McpConnection } from "./mcp";

import { buildCli } from "./cli";
import { connectMcp } from "./mcp";
import { createServer } from "./server";

interface Props<T extends Record<string, McpConnection>> {
  name: string;
  version: string;
  mcpServers: T;
  env: Record<string, keyof T>;
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
        envMapper: envList,
        env: props.env,
      });

      return createServer({
        name: props.name,
        version: props.version,
        adapter,
      });
    },
  };
}
