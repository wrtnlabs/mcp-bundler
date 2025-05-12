import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { connectMcp, RequiredEnv } from "./mcp";

vi.mock("@modelcontextprotocol/sdk/client/stdio.js", async () => {
  const actual = await vi.importActual<typeof import("@modelcontextprotocol/sdk/client/stdio.js")>(
    "@modelcontextprotocol/sdk/client/stdio.js",
  );
  return {
    ...actual,
    // eslint-disable-next-line ts/no-unsafe-argument
    StdioClientTransport: vi.fn().mockImplementation(config => new actual.StdioClientTransport(config)),
  };
});

describe("connectMcp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
      externalEnv: {},
    });

    expect(adapter.transport).toBeDefined();
  });

  it("should handle environment variables correctly", async () => {
    const adapter = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    const testEnv = {
      TEST_KEY: "test_value",
      ANOTHER_KEY: "another_value",
    };

    await connectMcp({
      adapter,
      mcpServers: {
        test: {
          command: "npx",
          args: ["-y", "@wrtnlabs/calculator-mcp@latest"],
          env: {
            TEST_KEY: RequiredEnv,
            ANOTHER_KEY: RequiredEnv,
          },
        },
      },
      externalEnv: testEnv,
    });

    expect(StdioClientTransport).toHaveBeenCalled();

    // eslint-disable-next-line ts/no-unsafe-assignment, ts/no-unsafe-member-access
    const lastCall = (StdioClientTransport as any).mock.calls[0][0];
    // eslint-disable-next-line ts/no-unsafe-member-access
    expect(lastCall.env.ANOTHER_KEY).toBe("another_value");
    // eslint-disable-next-line ts/no-unsafe-member-access
    expect(lastCall.env.TEST_KEY).toBe("test_value");
    await adapter.close();
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
      externalEnv: {},
    });

    expect(adapter.transport).toBeDefined();
    await adapter.close();
  });
});
