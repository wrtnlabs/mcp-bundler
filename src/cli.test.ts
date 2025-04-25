import { describe, expect, it, vi } from "vitest";

import { buildCli } from "./cli";

describe("buildCli", () => {
  it("should create a CLI program with correct version and name", () => {
    const program = buildCli({
      name: "test-cli",
      version: "1.0.0",
      mcpServers: {},
      env: {},
    });

    expect(program.name()).toBe("test-cli");
    expect(program.version()).toBe("1.0.0");
  });

  it("should handle SSE transport when port is provided", async () => {
    const consoleSpy = vi.spyOn(console, "log");
    const program = buildCli({
      name: "test-cli",
      version: "1.0.0",
      mcpServers: {},
      env: {},
    });

    await program.parseAsync(["node", "test-cli", "--port", "3001"]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("SSE"));
  });

  it("should use stdio transport when no port is provided", async () => {
    const consoleSpy = vi.spyOn(console, "log");
    const program = buildCli({
      name: "test-cli",
      version: "1.0.0",
      mcpServers: {},
      env: {},
    });

    await program.parseAsync(["node", "test-cli"]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("stdio"));
  });
});
