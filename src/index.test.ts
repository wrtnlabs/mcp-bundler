import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { bundler } from "./index";

describe("bundler", () => {
  describe("createServer", () => {
    let server: Server | undefined;
    let client: Client;
    let mockServer: Server;

    beforeAll(async () => {
      mockServer = new Server({
        name: "test-server",
        version: "1.0.0",
      }, {
        capabilities: {
          tools: {},
        },
      });

      mockServer.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
          tools: [],
        };
      });

      const b = bundler({
        name: "test-bundler",
        version: "1.0.0",
        mcpServers: {
          test: mockServer,
        },
        env: {},
      });

      client = new Client({
        name: "test-client",
        version: "1.0.0",
      });
      server = await b.createServer({});

      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await Promise.all([
        client.connect(clientTransport),
        server.connect(serverTransport),
      ]);
    }, 1000 * 100);

    afterAll(async () => {
      await server?.close();
      await mockServer?.close();
    });

    it("should create server successfully", () => {
      expect(server).toBeDefined();
    });

    it("should allow client to communicate with server", async () => {
      const response = await client.listTools();
      expect(response).toBeDefined();
      expect(response.tools).toEqual([]);
    });

    it("should handle multiple requests concurrently", async () => {
      const responses = await Promise.all([
        client.listTools(),
        client.listTools(),
        client.listTools(),
      ]);
      expect(responses).toHaveLength(3);
      responses.forEach((response) => {
        expect(response.tools).toEqual([]);
      });
    });
  });
});
