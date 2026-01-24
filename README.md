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

## Proxy

Set standard proxy environment variables to route Reddit API requests through a proxy (HTTP, HTTPS, or SOCKS5):

```bash
HTTPS_PROXY=http://proxy:8080 bun start
HTTPS_PROXY=socks5://proxy:1080 bun start
```

Supported variables (checked in order): `HTTPS_PROXY`, `https_proxy`, `HTTP_PROXY`, `http_proxy`, `ALL_PROXY`, `all_proxy`.

Authenticated proxies use URL format: `http://user:pass@proxy:8080`

Docker:

```bash
docker run --rm -i -e HTTPS_PROXY=http://proxy:8080 ghcr.io/paltaio/reddit-mcp:latest
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
