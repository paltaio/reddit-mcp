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

  it("returns empty object for no posts in json format", () => {
    const result = formatPosts([], "json");
    const parsed = JSON.parse(result);
    expect(parsed.posts).toEqual([]);
    expect(parsed.after).toBeNull();
  });

  it("formats real posts in md format", async () => {
    const searchResult = await search("javascript", 3);
    const result = formatPosts(searchResult.items, "md", searchResult.after);

    expect(result).toContain("##");
    expect(result).toContain("points");
    expect(result).toContain("comments");
    expect(result).toContain("by u/");
    expect(result).toContain("[View on Reddit]");
  });

  it("formats real posts in json format", async () => {
    const postsResult = await getSubredditPosts("programming", 2);
    const result = formatPosts(postsResult.items, "json", postsResult.after);
    const parsed = JSON.parse(result);

    expect(parsed.posts.length).toBe(2);
    expect(parsed.posts[0]).toHaveProperty("id");
    expect(parsed.posts[0]).toHaveProperty("title");
    expect(parsed.posts[0]).toHaveProperty("author");
  });

  it("separates multiple posts with dividers in md format", async () => {
    const searchResult = await search("python", 3);
    const result = formatPosts(searchResult.items, "md", searchResult.after);

    expect(result).toContain("---");
  });

  it("includes link for non-self posts", async () => {
    const postsResult = await getSubredditPosts("programming", 10);
    const linkPost = postsResult.items.find((p) => !p.is_self);

    if (linkPost) {
      const result = formatPosts([linkPost], "md");
      expect(result).toContain("Link:");
    }
  });

  it("includes pagination hint when after cursor is present", async () => {
    const postsResult = await getSubredditPosts("programming", 3);
    if (postsResult.after) {
      const result = formatPosts(postsResult.items, "md", postsResult.after);
      expect(result).toContain("More results available");
      expect(result).toContain(postsResult.after);
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
    expect(result).toMatch(/Subscribers: [\d,]+/);
  });
});

describe("formatPostWithComments", () => {
  it("formats real post with comments in md format", async () => {
    const postsResult = await getSubredditPosts("AskReddit", 1, "hot");
    const post = postsResult.items[0]!;
    const { comments } = await getPostComments("AskReddit", post.id, 5);

    const result = formatPostWithComments(post, comments, "md");

    expect(result).toContain("##");
    expect(result).toContain("## Comments");

    if (comments.length > 0) {
      expect(result).toContain("**u/");
      expect(result).toContain("points");
    }
  });

  it("formats real post with comments in json format", async () => {
    const postsResult = await getSubredditPosts("javascript", 1, "top", "week");
    const post = postsResult.items[0]!;
    const { comments } = await getPostComments("javascript", post.id, 3);

    const result = formatPostWithComments(post, comments, "json");
    const parsed = JSON.parse(result);

    expect(parsed).toHaveProperty("post");
    expect(parsed).toHaveProperty("comments");
    expect(parsed.post.id).toBe(post.id);
  });

  it("shows no comments message when comments array is empty", async () => {
    const postsResult = await getSubredditPosts("programming", 1);
    const post = postsResult.items[0]!;

    const result = formatPostWithComments(post, [], "md");
    expect(result).toContain("_No comments_");
  });

  it("formats nested replies correctly", async () => {
    // Get a popular post likely to have nested comments
    const postsResult = await getSubredditPosts("AskReddit", 1, "top", "week");
    const post = postsResult.items[0]!;
    const { comments } = await getPostComments("AskReddit", post.id, 10);

    const result = formatPostWithComments(post, comments, "md");

    if (comments.some((c) => c.replies.length > 0)) {
      expect(result).toContain("  **u/");
    }
  });
});
