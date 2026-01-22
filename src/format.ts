import type { RedditPost, RedditComment, SubredditInfo } from "./reddit.ts";

export type Format = "md" | "json";

function formatDate(utc: number): string {
  return new Date(utc * 1000).toISOString().split("T")[0]!;
}

function formatPostMd(post: RedditPost): string {
  const lines = [
    `## ${post.title}`,
    ``,
    `**r/${post.subreddit}** | ${post.score} points | ${post.num_comments} comments | by u/${post.author} | ${formatDate(post.created_utc)}`,
    ``,
  ];

  if (post.is_self && post.selftext) {
    lines.push(post.selftext.slice(0, 500) + (post.selftext.length > 500 ? "..." : ""));
    lines.push("");
  } else if (!post.is_self) {
    lines.push(`Link: ${post.url}`);
    lines.push("");
  }

  lines.push(`[View on Reddit](https://reddit.com${post.permalink})`);
  return lines.join("\n");
}

function formatCommentMd(comment: RedditComment, depth = 0): string {
  const indent = "  ".repeat(depth);
  const lines = [
    `${indent}**u/${comment.author}** | ${comment.score} points`,
    ``,
    comment.body
      .split("\n")
      .map((line) => indent + line)
      .join("\n"),
    ``,
  ];

  for (const reply of comment.replies.slice(0, 3)) {
    lines.push(formatCommentMd(reply, depth + 1));
  }

  return lines.join("\n");
}

export function formatPosts(posts: RedditPost[], format: Format): string {
  if (format === "json") {
    return JSON.stringify(posts, null, 2);
  }

  if (posts.length === 0) {
    return "No posts found.";
  }

  return posts.map(formatPostMd).join("\n\n---\n\n");
}

export function formatSubredditInfo(info: SubredditInfo, format: Format): string {
  if (format === "json") {
    return JSON.stringify(info, null, 2);
  }

  return [
    `# r/${info.name}`,
    ``,
    `**${info.title}**`,
    ``,
    info.description || "_No description_",
    ``,
    `- Subscribers: ${info.subscribers.toLocaleString()}`,
    `- Created: ${formatDate(info.created_utc)}`,
    `- NSFW: ${info.over18 ? "Yes" : "No"}`,
    ``,
    `[Visit subreddit](https://reddit.com${info.url})`,
  ].join("\n");
}

export function formatPostWithComments(
  post: RedditPost,
  comments: RedditComment[],
  format: Format
): string {
  if (format === "json") {
    return JSON.stringify({ post, comments }, null, 2);
  }

  const lines = [formatPostMd(post), "", "---", "", "## Comments", ""];

  if (comments.length === 0) {
    lines.push("_No comments_");
  } else {
    for (const comment of comments) {
      lines.push(formatCommentMd(comment));
      lines.push("---");
      lines.push("");
    }
  }

  return lines.join("\n");
}
