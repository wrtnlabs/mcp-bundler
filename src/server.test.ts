import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";

import { createServer } from "./server";

describe("createServer", () => {
  it("should create a server instance", () => {
    const client = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    const server = createServer({
      name: "test-server",
      version: "1.0.0",
      adapter: client,
    });

    expect(server).toBeDefined();
  });

  it("should handle tool listing requests", async () => {
    const client = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    const server = createServer({
      name: "test-server",
      version: "1.0.0",
      adapter: client,
    });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const tools = await client.listTools();
    expect(tools).toBeDefined();
  });

  it("should handle tool call requests", async () => {
    const client = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    const server = createServer({
      name: "test-server",
      version: "1.0.0",
      adapter: client,
    });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const result = await client.callTool({
      name: "test-tool",
      params: {},
    });

    expect(result).toBeDefined();
  });
});
