const BASE_URL = "https://old.reddit.com";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export interface RedditPost {
  id: string;
  title: string;
  author: string;
  score: number;
  url: string;
  selftext: string;
  permalink: string;
  subreddit: string;
  num_comments: number;
  created_utc: number;
  is_self: boolean;
}

export interface RedditComment {
  id: string;
  author: string;
  body: string;
  score: number;
  created_utc: number;
  depth: number;
  replies: RedditComment[];
}

export interface SubredditInfo {
  name: string;
  title: string;
  description: string;
  subscribers: number;
  created_utc: number;
  over18: boolean;
  url: string;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

function parsePost(data: Record<string, unknown>): RedditPost {
  return {
    id: data.id as string,
    title: data.title as string,
    author: data.author as string,
    score: data.score as number,
    url: data.url as string,
    selftext: data.selftext as string,
    permalink: data.permalink as string,
    subreddit: data.subreddit as string,
    num_comments: data.num_comments as number,
    created_utc: data.created_utc as number,
    is_self: data.is_self as boolean,
  };
}

function parseComment(child: Record<string, unknown>): RedditComment | null {
  if ((child.kind as string) !== "t1") return null;

  const data = child.data as Record<string, unknown>;
  const replies: RedditComment[] = [];

  if (data.replies && typeof data.replies === "object") {
    const repliesData = data.replies as Record<string, unknown>;
    const repliesListing = repliesData.data as Record<string, unknown>;
    if (repliesListing?.children) {
      for (const reply of repliesListing.children as Record<string, unknown>[]) {
        const parsed = parseComment(reply);
        if (parsed) replies.push(parsed);
      }
    }
  }

  return {
    id: data.id as string,
    author: data.author as string,
    body: data.body as string,
    score: data.score as number,
    created_utc: data.created_utc as number,
    depth: data.depth as number,
    replies,
  };
}

export interface PaginatedResult<T> {
  items: T[];
  after: string | null;
}

export async function search(
  query: string,
  limit = 5,
  sort: "relevance" | "hot" | "top" | "new" = "relevance",
  time: "hour" | "day" | "week" | "month" | "year" | "all" = "all",
  after?: string
): Promise<PaginatedResult<RedditPost>> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    sort,
    t: time,
  });
  if (after) params.set("after", after);

  const url = `${BASE_URL}/search.json?${params}`;
  const response = await fetchJson<Record<string, unknown>>(url);
  const data = response.data as Record<string, unknown>;
  const children = data.children as Record<string, unknown>[];

  return {
    items: children.map((child) => parsePost(child.data as Record<string, unknown>)),
    after: (data.after as string) ?? null,
  };
}

export async function getSubredditInfo(subreddit: string): Promise<SubredditInfo> {
  const url = `${BASE_URL}/r/${subreddit}/about.json`;
  const response = await fetchJson<Record<string, unknown>>(url);
  const data = response.data as Record<string, unknown>;

  return {
    name: data.display_name as string,
    title: data.title as string,
    description: data.public_description as string,
    subscribers: data.subscribers as number,
    created_utc: data.created_utc as number,
    over18: data.over18 as boolean,
    url: data.url as string,
  };
}

export async function getSubredditPosts(
  subreddit: string,
  limit = 5,
  sort: "hot" | "new" | "top" | "rising" = "hot",
  time: "hour" | "day" | "week" | "month" | "year" | "all" = "all",
  after?: string
): Promise<PaginatedResult<RedditPost>> {
  const params = new URLSearchParams({
    limit: String(limit),
    t: time,
  });
  if (after) params.set("after", after);

  const url = `${BASE_URL}/r/${subreddit}/${sort}.json?${params}`;
  const response = await fetchJson<Record<string, unknown>>(url);
  const data = response.data as Record<string, unknown>;
  const children = data.children as Record<string, unknown>[];

  return {
    items: children.map((child) => parsePost(child.data as Record<string, unknown>)),
    after: (data.after as string) ?? null,
  };
}

export async function getPostComments(
  subreddit: string,
  postId: string,
  limit = 20
): Promise<{ post: RedditPost; comments: RedditComment[] }> {
  const params = new URLSearchParams({ limit: String(limit) });
  const url = `${BASE_URL}/r/${subreddit}/comments/${postId}.json?${params}`;
  const response = await fetchJson<Record<string, unknown>[]>(url);

  const postListing = response[0] as Record<string, unknown>;
  const postData = postListing.data as Record<string, unknown>;
  const postChildren = postData.children as Record<string, unknown>[];
  const post = parsePost(postChildren[0]!.data as Record<string, unknown>);

  const commentsListing = response[1] as Record<string, unknown>;
  const commentsData = commentsListing.data as Record<string, unknown>;
  const commentChildren = commentsData.children as Record<string, unknown>[];

  const comments: RedditComment[] = [];
  for (const child of commentChildren) {
    const parsed = parseComment(child);
    if (parsed) comments.push(parsed);
  }

  return { post, comments };
}

export async function searchSubreddit(
  subreddit: string,
  query: string,
  limit = 5,
  sort: "relevance" | "hot" | "top" | "new" = "relevance",
  time: "hour" | "day" | "week" | "month" | "year" | "all" = "all",
  after?: string
): Promise<PaginatedResult<RedditPost>> {
  const params = new URLSearchParams({
    q: query,
    restrict_sr: "on",
    limit: String(limit),
    sort,
    t: time,
  });
  if (after) params.set("after", after);

  const url = `${BASE_URL}/r/${subreddit}/search.json?${params}`;
  const response = await fetchJson<Record<string, unknown>>(url);
  const data = response.data as Record<string, unknown>;
  const children = data.children as Record<string, unknown>[];

  return {
    items: children.map((child) => parsePost(child.data as Record<string, unknown>)),
    after: (data.after as string) ?? null,
  };
}
