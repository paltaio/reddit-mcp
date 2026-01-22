import { describe, expect, it } from "bun:test";
import { createServer } from "./server.ts";

describe("createServer", () => {
  it("creates server successfully", () => {
    const server = createServer();
    expect(server).toBeDefined();
  });

  it("registers all expected tools", () => {
    const server = createServer();
    // @ts-expect-error accessing private property for testing
    const tools = server._registeredTools as Record<string, unknown>;
    const toolNames = Object.keys(tools);

    expect(toolNames).toContain("search");
    expect(toolNames).toContain("subreddit_info");
    expect(toolNames).toContain("subreddit_posts");
    expect(toolNames).toContain("post_comments");
    expect(toolNames).toContain("subreddit_search");
  });

  it("search tool has correct schema", () => {
    const server = createServer();
    // @ts-expect-error accessing private property for testing
    const tools = server._registeredTools as Record<string, { description?: string }>;

    expect(tools["search"]).toBeDefined();
    expect(tools["search"]!.description).toBe("Search Reddit globally for posts matching a query");
  });

  it("subreddit_info tool has correct schema", () => {
    const server = createServer();
    // @ts-expect-error accessing private property for testing
    const tools = server._registeredTools as Record<string, { description?: string }>;

    expect(tools["subreddit_info"]).toBeDefined();
    expect(tools["subreddit_info"]!.description).toBe("Get information about a subreddit");
  });

  it("subreddit_posts tool has correct schema", () => {
    const server = createServer();
    // @ts-expect-error accessing private property for testing
    const tools = server._registeredTools as Record<string, { description?: string }>;

    expect(tools["subreddit_posts"]).toBeDefined();
    expect(tools["subreddit_posts"]!.description).toBe("Get posts from a subreddit");
  });

  it("post_comments tool has correct schema", () => {
    const server = createServer();
    // @ts-expect-error accessing private property for testing
    const tools = server._registeredTools as Record<string, { description?: string }>;

    expect(tools["post_comments"]).toBeDefined();
    expect(tools["post_comments"]!.description).toBe("Get a post and its comments");
  });

  it("subreddit_search tool has correct schema", () => {
    const server = createServer();
    // @ts-expect-error accessing private property for testing
    const tools = server._registeredTools as Record<string, { description?: string }>;

    expect(tools["subreddit_search"]).toBeDefined();
    expect(tools["subreddit_search"]!.description).toBe("Search within a specific subreddit");
  });
});
