import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  search,
  getSubredditInfo,
  getSubredditPosts,
  getPostComments,
  searchSubreddit,
} from "./reddit.ts";
import { formatPosts, formatSubredditInfo, formatPostWithComments } from "./format.ts";
import { version } from "../package.json";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "reddit-mcp",
    version,
  });

  const formatSchema = z.enum(["md", "json"]).default("md").describe("Output format: md (markdown) or json");
  const sortSchema = z.enum(["relevance", "hot", "top", "new"]).default("relevance");
  const postSortSchema = z.enum(["hot", "new", "top", "rising"]).default("hot");
  const timeSchema = z.enum(["hour", "day", "week", "month", "year", "all"]).default("all");

  server.registerTool(
    "search",
    {
      title: "Search Reddit",
      description: "Search Reddit globally for posts matching a query",
      inputSchema: {
        query: z.string().describe("Search query"),
        limit: z.number().min(1).max(25).default(5).describe("Number of results (max 25)"),
        sort: sortSchema.describe("Sort order"),
        time: timeSchema.describe("Time filter for results"),
        after: z.string().optional().describe("Pagination cursor from previous response"),
        format: formatSchema,
      },
    },
    async ({ query, limit, sort, time, after, format }) => {
      const result = await search(query, limit, sort, time, after);
      const text = formatPosts(result.items, format, result.after);
      return { content: [{ type: "text", text }] };
    }
  );

  server.registerTool(
    "subreddit_info",
    {
      title: "Get Subreddit Info",
      description: "Get information about a subreddit",
      inputSchema: {
        subreddit: z.string().describe("Subreddit name (without r/)"),
        format: formatSchema,
      },
    },
    async ({ subreddit, format }) => {
      const info = await getSubredditInfo(subreddit);
      const text = formatSubredditInfo(info, format);
      return { content: [{ type: "text", text }] };
    }
  );

  server.registerTool(
    "subreddit_posts",
    {
      title: "Get Subreddit Posts",
      description: "Get posts from a subreddit",
      inputSchema: {
        subreddit: z.string().describe("Subreddit name (without r/)"),
        limit: z.number().min(1).max(25).default(5).describe("Number of posts (max 25)"),
        sort: postSortSchema.describe("Sort order"),
        time: timeSchema.describe("Time filter (only applies to top)"),
        after: z.string().optional().describe("Pagination cursor from previous response"),
        format: formatSchema,
      },
    },
    async ({ subreddit, limit, sort, time, after, format }) => {
      const result = await getSubredditPosts(subreddit, limit, sort, time, after);
      const text = formatPosts(result.items, format, result.after);
      return { content: [{ type: "text", text }] };
    }
  );

  server.registerTool(
    "post_comments",
    {
      title: "Get Post Comments",
      description: "Get a post and its comments",
      inputSchema: {
        subreddit: z.string().describe("Subreddit name (without r/)"),
        post_id: z.string().describe("Post ID (the base36 ID from the URL)"),
        limit: z.number().min(1).max(50).default(10).describe("Number of top-level comments (max 50)"),
        format: formatSchema,
      },
    },
    async ({ subreddit, post_id, limit, format }) => {
      const { post, comments } = await getPostComments(subreddit, post_id, limit);
      const text = formatPostWithComments(post, comments, format);
      return { content: [{ type: "text", text }] };
    }
  );

  server.registerTool(
    "subreddit_search",
    {
      title: "Search Subreddit",
      description: "Search within a specific subreddit",
      inputSchema: {
        subreddit: z.string().describe("Subreddit name (without r/)"),
        query: z.string().describe("Search query"),
        limit: z.number().min(1).max(25).default(5).describe("Number of results (max 25)"),
        sort: sortSchema.describe("Sort order"),
        time: timeSchema.describe("Time filter for results"),
        after: z.string().optional().describe("Pagination cursor from previous response"),
        format: formatSchema,
      },
    },
    async ({ subreddit, query, limit, sort, time, after, format }) => {
      const result = await searchSubreddit(subreddit, query, limit, sort, time, after);
      const text = formatPosts(result.items, format, result.after);
      return { content: [{ type: "text", text }] };
    }
  );

  return server;
}
