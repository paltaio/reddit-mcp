# reddit-mcp

MCP server for Reddit public data. Uses Reddit's public JSON API (no authentication required).

## Tools

| Tool | Description |
|------|-------------|
| `search` | Search Reddit globally |
| `subreddit_info` | Get subreddit details |
| `subreddit_posts` | Get posts from a subreddit |
| `post_comments` | Get a post with comments |
| `subreddit_search` | Search within a subreddit |

All tools accept a `format` parameter: `md` (default) or `json`.

## Usage

### Stdio transport (default)

```bash
bun install
bun start
```

### HTTP transport

```bash
bun start:http
# Server runs on http://localhost:3000/mcp
```

Custom port:

```bash
PORT=8080 bun start:http
```

### Docker

```bash
# stdio (default)
docker run --rm -i ghcr.io/paltaio/reddit-mcp:latest

# http
docker run --rm -p 3000:3000 -e TRANSPORT=http ghcr.io/paltaio/reddit-mcp:latest
```

## MCP client config

### Stdio (Claude Code)

```json
{
  "mcpServers": {
    "reddit": {
      "command": "bun",
      "args": ["start"],
      "cwd": "/path/to/reddit-mcp"
    }
  }
}
```

### HTTP

```json
{
  "mcpServers": {
    "reddit": {
      "type": "http",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```
