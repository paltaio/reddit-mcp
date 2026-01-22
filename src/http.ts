import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createServer } from "./server.ts";
import { version } from "../package.json";

const sessions = new Map<string, StreamableHTTPServerTransport>();

const PORT = Number(process.env.PORT) || 3000;

function sendJsonError(res: ServerResponse, code: number, message: string, id: string | number | null = null) {
  res.writeHead(400, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ jsonrpc: "2.0", error: { code, message }, id }));
}

async function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

const httpServer = createHttpServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (url.pathname !== "/mcp") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  if (req.method === "POST") {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    // Ensure Accept header includes required MIME types for StreamableHTTPServerTransport
    const accept = req.headers.accept ?? "";
    if (!accept.includes("text/event-stream")) {
      req.headers.accept = "application/json, text/event-stream";
    }

    let body: unknown;
    try {
      body = await parseBody(req);
    } catch {
      sendJsonError(res, -32700, "Parse error");
      return;
    }

    let transport: StreamableHTTPServerTransport;

    if (sessionId && sessions.has(sessionId)) {
      transport = sessions.get(sessionId)!;
    } else if (!sessionId && isInitializeRequest(body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        enableJsonResponse: true,
        onsessioninitialized: (id) => {
          sessions.set(id, transport);
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          sessions.delete(transport.sessionId);
        }
      };

      const server = createServer();
      await server.connect(transport);
    } else {
      sendJsonError(res, -32000, "Invalid session or missing initialization");
      return;
    }

    await transport.handleRequest(req, res, body);
    return;
  }

  if (req.method === "DELETE") {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !sessions.has(sessionId)) {
      sendJsonError(res, -32000, "Invalid session");
      return;
    }

    const transport = sessions.get(sessionId)!;
    await transport.close();
    sessions.delete(sessionId);

    res.writeHead(204);
    res.end();
    return;
  }

  res.writeHead(405);
  res.end("Method not allowed");
});

httpServer.listen(PORT, () => {
  console.log(`reddit-mcp v${version} running on http://localhost:${PORT}/mcp`);
});
