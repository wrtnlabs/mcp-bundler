import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioClientTransport, StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";


export type SSEMcpConnection = {
    url: URL;
}
export type StdioMcpConnection = StdioServerParameters;
export type InMemoryMcpConnection = Server;
export type McpConnection = SSEMcpConnection | StdioMcpConnection | InMemoryMcpConnection;

interface Props {
    name: string;
    version: string;
    mcpServers: Record<string, McpConnection>;
}

export const bundler = async (props: Props): Promise<Server> => {
    const adapter = new Client({
        name: props.name,
        version: props.version
    });
    await connectMcp({
        adapter,
        mcpServers: props.mcpServers
    });

    const server = new Server({
        name: props.name,
        version: props.version
    });

    return server;
}

/**
 * Connects to the MCP servers and returns the client transport.
 * 
 * @throws Error if the MCP server configuration is invalid.
 */
export const connectMcp = async (props: {
    adapter: Client;
    mcpServers: Record<string, McpConnection>;
}) => {

    const transports = await Promise.all(Object.entries(props.mcpServers).map(async ([name, setting]) => {
        // InMemory
        if(setting instanceof Server) {
            const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
            await setting.connect(serverTransport);
            return clientTransport;
        }

        // SSE
        if("url" in setting) {
            return new SSEClientTransport(setting.url);
        }

        // Stdio
        if("command" in setting) {
            return new StdioClientTransport(setting);
        }

        setting satisfies never;
        throw new Error(`Invalid MCP server configuration: ${name}\n${JSON.stringify(setting, null, 2)}`);
    }));
    
    for (const transport of transports) {
        if(transport) {
            await props.adapter.connect(transport);
        }
    }
}