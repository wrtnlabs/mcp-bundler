import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";

import type { McpConnection } from "./mcp";

import { buildCli } from "./cli";
import { connectMcp } from "./mcp";
import { createServer } from "./server";

interface Props<T extends string> {
  name: string;
  version: string;
  mcpServers: Record<T, McpConnection>;
  env: Record<string, T>;
}

export function bundler<T extends string>(props: Props<T>): {
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
