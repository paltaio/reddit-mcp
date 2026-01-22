import { describe, expect, it } from "bun:test";
import {
  search,
  getSubredditInfo,
  getSubredditPosts,
  getPostComments,
  searchSubreddit,
  type RedditPost,
  type RedditComment,
  type SubredditInfo,
} from "./reddit.ts";

function assertValidPost(post: RedditPost) {
  expect(typeof post.id).toBe("string");
  expect(post.id.length).toBeGreaterThan(0);
  expect(typeof post.title).toBe("string");
  expect(typeof post.author).toBe("string");
  expect(typeof post.score).toBe("number");
  expect(typeof post.url).toBe("string");
  expect(typeof post.selftext).toBe("string");
  expect(typeof post.permalink).toBe("string");
  expect(post.permalink).toMatch(/^\/r\//);
  expect(typeof post.subreddit).toBe("string");
  expect(typeof post.num_comments).toBe("number");
  expect(typeof post.created_utc).toBe("number");
  expect(typeof post.is_self).toBe("boolean");
}

function assertValidComment(comment: RedditComment) {
  expect(typeof comment.id).toBe("string");
  expect(typeof comment.author).toBe("string");
  expect(typeof comment.body).toBe("string");
  expect(typeof comment.score).toBe("number");
  expect(typeof comment.created_utc).toBe("number");
  expect(typeof comment.depth).toBe("number");
  expect(Array.isArray(comment.replies)).toBe(true);
}

function assertValidSubredditInfo(info: SubredditInfo) {
  expect(typeof info.name).toBe("string");
  expect(info.name.length).toBeGreaterThan(0);
  expect(typeof info.title).toBe("string");
  expect(typeof info.description).toBe("string");
  expect(typeof info.subscribers).toBe("number");
  expect(info.subscribers).toBeGreaterThan(0);
  expect(typeof info.created_utc).toBe("number");
  expect(typeof info.over18).toBe("boolean");
  expect(typeof info.url).toBe("string");
  expect(info.url).toMatch(/^\/r\//);
}

describe("search", () => {
  it("returns posts matching query", async () => {
    const posts = await search("javascript", 5);
    expect(posts.length).toBeGreaterThan(0);
    expect(posts.length).toBeLessThanOrEqual(5);
    posts.forEach(assertValidPost);
  });

  it("respects limit parameter", async () => {
    const posts = await search("python programming", 3);
    expect(posts.length).toBeLessThanOrEqual(3);
  });

  it("accepts sort parameter", async () => {
    const posts = await search("react", 3, "top");
    expect(posts.length).toBeGreaterThan(0);
    posts.forEach(assertValidPost);
  });

  it("accepts time parameter", async () => {
    const posts = await search("typescript", 3, "top", "year");
    expect(posts.length).toBeGreaterThan(0);
    posts.forEach(assertValidPost);
  });
});

describe("getSubredditInfo", () => {
  it("returns info for valid subreddit", async () => {
    const info = await getSubredditInfo("programming");
    assertValidSubredditInfo(info);
    expect(info.name.toLowerCase()).toBe("programming");
  });

  it("returns subscriber count", async () => {
    const info = await getSubredditInfo("javascript");
    expect(info.subscribers).toBeGreaterThan(1000);
  });

  it("throws for non-existent subreddit", async () => {
    try {
      await getSubredditInfo("thissubredditdoesnotexist12345xyz");
      expect.unreachable("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});

describe("getSubredditPosts", () => {
  it("returns posts from subreddit", async () => {
    const posts = await getSubredditPosts("programming", 5);
    expect(posts.length).toBeGreaterThan(0);
    expect(posts.length).toBeLessThanOrEqual(5);
    posts.forEach(assertValidPost);
    posts.forEach((post) => {
      expect(post.subreddit.toLowerCase()).toBe("programming");
    });
  });

  it("respects sort parameter", async () => {
    const hotPosts = await getSubredditPosts("javascript", 3, "hot");
    const newPosts = await getSubredditPosts("javascript", 3, "new");
    expect(hotPosts.length).toBeGreaterThan(0);
    expect(newPosts.length).toBeGreaterThan(0);
    hotPosts.forEach(assertValidPost);
    newPosts.forEach(assertValidPost);
  });

  it("accepts time parameter for top sort", async () => {
    const posts = await getSubredditPosts("typescript", 3, "top", "month");
    expect(posts.length).toBeGreaterThan(0);
    posts.forEach(assertValidPost);
  });
});

describe("getPostComments", () => {
  it("returns post and comments", async () => {
    // First get a post from a popular subreddit to get a valid post ID
    const posts = await getSubredditPosts("AskReddit", 1, "hot");
    expect(posts.length).toBeGreaterThan(0);
    const post = posts[0]!;

    const result = await getPostComments("AskReddit", post.id, 5);
    assertValidPost(result.post);
    expect(result.post.id).toBe(post.id);
    expect(Array.isArray(result.comments)).toBe(true);

    if (result.comments.length > 0) {
      result.comments.forEach(assertValidComment);
    }
  });

  it("returns nested replies when present", async () => {
    // Get a popular post likely to have nested comments
    const posts = await getSubredditPosts("AskReddit", 1, "top", "week");
    expect(posts.length).toBeGreaterThan(0);
    const post = posts[0]!;

    const result = await getPostComments("AskReddit", post.id, 10);
    expect(result.comments.length).toBeGreaterThan(0);

    // Check if any comment has replies (common in popular posts)
    const hasNestedReplies = result.comments.some((c) => c.replies.length > 0);
    // We don't assert this must be true since it depends on the post
    if (hasNestedReplies) {
      const commentWithReplies = result.comments.find((c) => c.replies.length > 0)!;
      commentWithReplies.replies.forEach(assertValidComment);
    }
  });
});

describe("searchSubreddit", () => {
  it("searches within specific subreddit", async () => {
    const posts = await searchSubreddit("javascript", "async await", 5);
    expect(posts.length).toBeGreaterThan(0);
    posts.forEach(assertValidPost);
    posts.forEach((post) => {
      expect(post.subreddit.toLowerCase()).toBe("javascript");
    });
  });

  it("respects sort and time parameters", async () => {
    const posts = await searchSubreddit("typescript", "generics", 3, "top", "year");
    expect(posts.length).toBeGreaterThan(0);
    posts.forEach(assertValidPost);
  });
});
