import { describe, expect, it } from "bun:test";
import { createServer } from "./server.ts";

describe("createServer", () => {
  it("registers all expected tools with correct descriptions", () => {
    const server = createServer();
    // @ts-expect-error accessing private property for testing
    const tools = server._registeredTools as Record<string, { description?: string }>;

    const expectedTools = {
      search: "Search Reddit globally for posts matching a query",
      subreddit_info: "Get information about a subreddit",
      subreddit_posts: "Get posts from a subreddit",
      post_comments: "Get a post and its comments",
      subreddit_search: "Search within a specific subreddit",
    };

    for (const [name, description] of Object.entries(expectedTools)) {
      expect(tools[name]).toBeDefined();
      expect(tools[name]!.description).toBe(description);
    }
  });
});
