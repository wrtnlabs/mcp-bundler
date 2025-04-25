import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { describe, expect, it } from "vitest";

import { connectMcp } from "./mcp";

describe("connectMcp", () => {
  it("should connect to InMemory MCP server", async () => {
    const server = new Server({
      name: "test-server",
      version: "1.0.0",
    });

    const adapter = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    await connectMcp({
      adapter,
      mcpServers: {
        test: server,
      },
      env: {},
      envMapper: {},
    });

    expect(adapter.transport).toBeDefined();
  });

  it("should handle environment variables correctly", async () => {
    const server = new Server({
      name: "test-server",
      version: "1.0.0",
    });

    const adapter = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    const envMapper = {
      TEST_KEY: "test_value",
    };

    await connectMcp({
      adapter,
      mcpServers: {
        test: server,
      },
      env: {
        TEST_KEY: "test",
      },
      envMapper,
    });

    expect(process.env.TEST_KEY).toBe("test_value");
  });

  it("should handle multiple MCP servers", async () => {
    const server1 = new Server({
      name: "test-server-1",
      version: "1.0.0",
    });

    const server2 = new Server({
      name: "test-server-2",
      version: "1.0.0",
    });

    const adapter = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    await connectMcp({
      adapter,
      mcpServers: {
        test1: server1,
        test2: server2,
      },
      env: {},
      envMapper: {},
    });

    expect(adapter.transport).toBeDefined();
  });
});
