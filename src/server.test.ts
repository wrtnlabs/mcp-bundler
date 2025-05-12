import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";

import { createServer } from "./server";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

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
    server.close();
  });

  it("should handle tool listing requests", async () => {
    const _client = new Client({
      name: "calculator-client",
      version: "1.0.0",
    });

    const _stdioTransport = new StdioClientTransport({
      command: "npx",
      args: ["-y", "@wrtnlabs/calculator-mcp@latest"],
    });

    await _client.connect(_stdioTransport);

    const server = createServer({
      name: "test-server",
      version: "1.0.0",
      adapter: _client,
    });

    const client = new Client({
      name: "test-client",
      version: "1.0.0",
    });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    const tools = await client.listTools();
    
    expect(tools).toBeDefined();
    await _client.close();
    await client.close();
    await server.close();
  });

  it("should handle tool call requests", async () => {
    const _client = new Client({
      name: "calculator-client",
      version: "1.0.0",
    });

    const _stdioTransport = new StdioClientTransport({
      command: "npx",
      args: ["-y", "@wrtnlabs/calculator-mcp@latest"],
    });

    await _client.connect(_stdioTransport);

    const server = createServer({
      name: "test-server",
      version: "1.0.0",
      adapter: _client,
    });

    const client = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const result = await client.callTool({
      name: "test-tool",
      params: {},
    });

    expect(result).toBeDefined();
    await client.close();
    await server.close();
  });
});
