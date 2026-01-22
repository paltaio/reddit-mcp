import { describe, expect, it } from "bun:test";
import { formatPosts, formatSubredditInfo, formatPostWithComments } from "./format.ts";
import {
  search,
  getSubredditInfo,
  getSubredditPosts,
  getPostComments,
} from "./reddit.ts";

describe("formatPosts", () => {
  it("returns empty message for no posts in md format", () => {
    const result = formatPosts([], "md");
    expect(result).toBe("No posts found.");
  });

  it("returns empty array for no posts in json format", () => {
    const result = formatPosts([], "json");
    expect(result).toBe("[]");
  });

  it("formats real posts in md format", async () => {
    const posts = await search("javascript", 3);
    const result = formatPosts(posts, "md");

    expect(result).toContain("##"); // Post titles
    expect(result).toContain("points");
    expect(result).toContain("comments");
    expect(result).toContain("by u/");
    expect(result).toContain("[View on Reddit]");
  });

  it("formats real posts in json format", async () => {
    const posts = await getSubredditPosts("programming", 2);
    const result = formatPosts(posts, "json");
    const parsed = JSON.parse(result);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);
    expect(parsed[0]).toHaveProperty("id");
    expect(parsed[0]).toHaveProperty("title");
    expect(parsed[0]).toHaveProperty("author");
  });

  it("separates multiple posts with dividers in md format", async () => {
    const posts = await search("python", 3);
    const result = formatPosts(posts, "md");

    expect(result).toContain("---");
  });

  it("includes link for non-self posts", async () => {
    // Search for link posts (not self posts)
    const posts = await getSubredditPosts("programming", 10);
    const linkPost = posts.find((p) => !p.is_self);

    if (linkPost) {
      const result = formatPosts([linkPost], "md");
      expect(result).toContain("Link:");
    }
  });
});

describe("formatSubredditInfo", () => {
  it("formats real subreddit info in md format", async () => {
    const info = await getSubredditInfo("javascript");
    const result = formatSubredditInfo(info, "md");

    expect(result).toContain("# r/javascript");
    expect(result).toContain("Subscribers:");
    expect(result).toContain("Created:");
    expect(result).toContain("NSFW:");
    expect(result).toContain("[Visit subreddit]");
  });

  it("formats real subreddit info in json format", async () => {
    const info = await getSubredditInfo("typescript");
    const result = formatSubredditInfo(info, "json");
    const parsed = JSON.parse(result);

    expect(parsed).toHaveProperty("name");
    expect(parsed).toHaveProperty("subscribers");
    expect(parsed).toHaveProperty("over18");
    expect(parsed.name.toLowerCase()).toBe("typescript");
  });

  it("formats subscriber count with commas", async () => {
    const info = await getSubredditInfo("programming");
    const result = formatSubredditInfo(info, "md");

    // Programming has many subscribers, should have comma formatting
    expect(result).toMatch(/Subscribers: [\d,]+/);
  });
});

describe("formatPostWithComments", () => {
  it("formats real post with comments in md format", async () => {
    const posts = await getSubredditPosts("AskReddit", 1, "hot");
    const post = posts[0]!;
    const { comments } = await getPostComments("AskReddit", post.id, 5);

    const result = formatPostWithComments(post, comments, "md");

    expect(result).toContain("##"); // Post title
    expect(result).toContain("## Comments");

    if (comments.length > 0) {
      expect(result).toContain("**u/"); // Comment author
      expect(result).toContain("points");
    }
  });

  it("formats real post with comments in json format", async () => {
    const posts = await getSubredditPosts("javascript", 1, "top", "week");
    const post = posts[0]!;
    const { comments } = await getPostComments("javascript", post.id, 3);

    const result = formatPostWithComments(post, comments, "json");
    const parsed = JSON.parse(result);

    expect(parsed).toHaveProperty("post");
    expect(parsed).toHaveProperty("comments");
    expect(parsed.post.id).toBe(post.id);
    expect(Array.isArray(parsed.comments)).toBe(true);
  });

  it("shows no comments message when comments array is empty", async () => {
    const posts = await getSubredditPosts("programming", 1);
    const post = posts[0]!;

    const result = formatPostWithComments(post, [], "md");
    expect(result).toContain("_No comments_");
  });

  it("formats nested replies correctly", async () => {
    // Get a popular post likely to have nested comments
    const posts = await getSubredditPosts("AskReddit", 1, "top", "week");
    const post = posts[0]!;
    const { comments } = await getPostComments("AskReddit", post.id, 10);

    const result = formatPostWithComments(post, comments, "md");

    // Check that the output includes proper indentation for replies
    // Replies are indented with 2 spaces per depth level
    if (comments.some((c) => c.replies.length > 0)) {
      expect(result).toContain("  **u/"); // Indented reply author
    }
  });
});
