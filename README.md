[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/wrtnlabs-mcp-bundler-badge.png)](https://mseep.ai/app/wrtnlabs-mcp-bundler)

# MCP Bundler

Have MCP server setups been too complicated until now?
Was it difficult to share MCP settings with each other?

This is a library that lets you bundle an MCP server setup easily.

## Usage

```typescript
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

import { createServer } from "@wrtnlabs/calculator-mcp";
import { bundler, RequiredEnv } from "@wrtnlabs/mcp-bundler";

export const server: Server = bundler({
  name: "The cool Server",
  version: "0.0.1",
  mcpServers: {
    figma: {
      command: "bun",
      args: [
        "--watch",
        "/path/to/figma-mcp/src/index.ts",
      ],
      env: {
        FIGMA_PERSONAL_ACCESS_TOKEN: RequiredEnv,
        PORT: RequiredEnv,
      },
    },
    calculator: createServer({
      name: "calculator",
      version: "1.0.0"
    }),
    notionApi: {
      command: "npx",
      args: ["-y", "@notionhq/notion-mcp-server"],
      env: {
        OPENAPI_MCP_HEADERS: RequiredEnv,
      },
    },
  },
})();
```

### stdio mode

```sh
> npx example-mcp
```

### SSE mode

```sh
> npx example-mcp -p 4506
```

### InMemory mode

```typescript
import { Server } from "example-mcp";
// other import statement

const client = new Client({
  name: "test client",
  version: "0.1.0",
});

const server = createServer({
  name: "calculator",
  version: "1.0.0"
});

const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

await Promise.all([
  client.connect(clientTransport),
  server.connect(serverTransport),
]);
```

### in other ide and options

```
{
  "mcpServers": {
    "example-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "example-mcp@latest"
      ]
    }
  }
}
```
