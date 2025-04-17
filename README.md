# MCP Bundler

## Usage

```typescript
import { bundler } from "@wrtnlabs/mcp-bundler";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { createServer } from "@wrtnlabs/calculator-mcp";

export const server: Server = bundler({
    mcpServers: {
        figma: {
            command: "bun",
            args: [
                "--watch",
                "/path/to/figma-mcp/src/index.ts",
                "-e",
                "FIGMA_PERSONAL_ACCESS_TOKEN=your_token_here",
                "-e",
                "PORT=6000"
            ]
        },
        calculator: createServer({
            name: "calculator",
            version: "1.0.0"
        }),
        "notionApi": {
            "command": "npx",
            "args": ["-y", "@notionhq/notion-mcp-server"],
            "env": {
                "OPENAPI_MCP_HEADERS": "{\"Authorization\": \"Bearer ntn_****\", \"Notion-Version\": \"2022-06-28\" }"
            }
        },
    }
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