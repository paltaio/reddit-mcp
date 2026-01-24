import { describe, expect, it } from "bun:test";
import {
  search,
  getSubredditInfo,
  getSubredditPosts,
  getPostComments,
  searchSubreddit,
} from "./reddit.ts";

describe("search", () => {
  it("returns posts matching query", async () => {
    const result = await search("javascript", 5);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.length).toBeLessThanOrEqual(5);
  });

  it("respects limit parameter", async () => {
    const result = await search("python programming", 3);
    expect(result.items.length).toBeLessThanOrEqual(3);
  });

});

describe("getSubredditInfo", () => {
  it("returns info for valid subreddit", async () => {
    const info = await getSubredditInfo("programming");
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
    const result = await getSubredditPosts("programming", 5);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.length).toBeLessThanOrEqual(5);
    result.items.forEach((post) => {
      expect(post.subreddit.toLowerCase()).toBe("programming");
    });
  });

  it("respects sort parameter", async () => {
    const hotResult = await getSubredditPosts("javascript", 3, "hot");
    const newResult = await getSubredditPosts("javascript", 3, "new");
    expect(hotResult.items.length).toBeGreaterThan(0);
    expect(newResult.items.length).toBeGreaterThan(0);
  });

  it("accepts time parameter for top sort", async () => {
    const result = await getSubredditPosts("typescript", 3, "top", "month");
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("supports pagination with after cursor", async () => {
    const first = await getSubredditPosts("programming", 3);
    expect(first.items.length).toBeGreaterThan(0);
    if (first.after) {
      const second = await getSubredditPosts("programming", 3, "hot", "all", first.after);
      expect(second.items.length).toBeGreaterThan(0);
      expect(second.items[0]!.id).not.toBe(first.items[0]!.id);
    }
  });
});

describe("getPostComments", () => {
  it("returns post and comments", async () => {
    const postsResult = await getSubredditPosts("AskReddit", 1, "hot");
    expect(postsResult.items.length).toBeGreaterThan(0);
    const post = postsResult.items[0]!;

    const result = await getPostComments("AskReddit", post.id, 5);
    expect(result.post.id).toBe(post.id);
  });

  it("returns nested replies when present", async () => {
    const postsResult = await getSubredditPosts("AskReddit", 1, "top", "week");
    expect(postsResult.items.length).toBeGreaterThan(0);
    const post = postsResult.items[0]!;

    const result = await getPostComments("AskReddit", post.id, 10);
    expect(result.comments.length).toBeGreaterThan(0);
  });
});

describe("searchSubreddit", () => {
  it("searches within specific subreddit", async () => {
    const result = await searchSubreddit("javascript", "async await", 5);
    expect(result.items.length).toBeGreaterThan(0);
    result.items.forEach((post) => {
      expect(post.subreddit.toLowerCase()).toBe("javascript");
    });
  });

  it("respects sort and time parameters", async () => {
    const result = await searchSubreddit("typescript", "generics", 3, "top", "year");
    expect(result.items.length).toBeGreaterThan(0);
  });
});
