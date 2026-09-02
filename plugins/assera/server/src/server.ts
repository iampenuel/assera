import { createServer as createHttpServer } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

export const TOOL_NAME = "show_assera_demo";
export const WIDGET_URI = "ui://widget/assera-demo-v3.html";
export const SITE_ORIGIN = "https://assera-webmcp.stanleyzebulonp.chatgpt.site";
export const CASE_URL = `${SITE_ORIGIN}/case/NS-PA-48291`;

export const DEMO_INFO = Object.freeze({
  name: "ASSERA",
  tagline: "A denial isn’t the final word.",
  site_url: SITE_ORIGIN,
  case_url: CASE_URL,
  synthetic: true,
  webmcp: true,
  webmcp_tool_count: 7,
});

export function getWidgetDomain(): string | undefined {
  const configuredOrigin =
    process.env.ASSERA_WIDGET_ORIGIN?.trim() || process.env.RENDER_EXTERNAL_URL?.trim();

  if (!configuredOrigin) {
    return undefined;
  }

  const url = new URL(configuredOrigin);
  if (url.protocol !== "https:") {
    throw new Error("ASSERA widget origin must use HTTPS.");
  }

  return url.origin;
}

const sourceDirectory = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve(sourceDirectory, "../..");

function readPluginFile(path: string): string {
  return readFileSync(resolve(pluginRoot, path), "utf8");
}

function imageDataUri(path: string, mimeType = "image/png"): string {
  const bytes = readFileSync(resolve(pluginRoot, path));
  return `data:${mimeType};base64,${bytes.toString("base64")}`;
}

export function buildWidgetHtml(): string {
  return readPluginFile("web/index.html")
    .replace("/* __ASSERA_STYLES__ */", readPluginFile("web/styles.css"))
    .replace("/* __ASSERA_APP__ */", readPluginFile("web/app.js"))
    .replaceAll("__ASSERA_LOGO_LIGHT__", imageDataUri("assets/logo.png"))
    .replaceAll("__ASSERA_LOGO_DARK__", imageDataUri("assets/logo-dark.png"));
}

const outputSchema = {
  name: z.literal("ASSERA"),
  tagline: z.string(),
  site_url: z.string().url(),
  case_url: z.string().url(),
  synthetic: z.literal(true),
  webmcp: z.literal(true),
  webmcp_tool_count: z.literal(7),
};

export function createAsseraServer(): McpServer {
  const widgetDomain = getWidgetDomain();
  const server = new McpServer({
    name: "assera-plugin-server",
    version: "0.1.0",
  });

  registerAppResource(
    server,
    "assera-demo-widget",
    WIDGET_URI,
    {},
    async () => ({
      contents: [
        {
          uri: WIDGET_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: buildWidgetHtml(),
          _meta: {
            ui: {
              prefersBorder: false,
              ...(widgetDomain ? { domain: widgetDomain } : {}),
              csp: {
                connectDomains: [],
                resourceDomains: [SITE_ORIGIN],
                frameDomains: [],
              },
            },
            "openai/widgetDescription":
              "A branded, read-only launcher for ASSERA and Maya’s public synthetic prior-authorization case.",
            "openai/widgetPrefersBorder": false,
            ...(widgetDomain ? { "openai/widgetDomain": widgetDomain } : {}),
            "openai/widgetCSP": {
              connect_domains: [],
              resource_domains: [SITE_ORIGIN],
              redirect_domains: [SITE_ORIGIN],
            },
          },
        },
      ],
    }),
  );

  registerAppTool(
    server,
    TOOL_NAME,
    {
      title: "Open ASSERA",
      description:
        "Shows the branded ASSERA launcher and guidance for the public synthetic prior-authorization case experience. Use when someone asks to open, see, explore, or understand ASSERA or Maya’s synthetic case. This tool does not inspect or mutate case state; the public website exposes the seven authoritative WebMCP tools.",
      inputSchema: {},
      outputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: {
        ui: { resourceUri: WIDGET_URI },
        "openai/outputTemplate": WIDGET_URI,
        "openai/toolInvocation/invoking": "Opening ASSERA…",
        "openai/toolInvocation/invoked": "ASSERA ready",
      },
    },
    async () => ({
      content: [
        {
          type: "text",
          text: "ASSERA is open. Maya’s case is synthetic, and the public site exposes seven WebMCP tools for the case workflow.",
        },
      ],
      structuredContent: DEMO_INFO,
    }),
  );

  return server;
}

export async function runStdio(): Promise<void> {
  console.error("Starting ASSERA Plugin MCP server over stdio.");
  const server = createAsseraServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ASSERA Plugin MCP server running over stdio.");
}

export function runHttp(): ReturnType<typeof createHttpServer> {
  const host = process.env.HOST ?? "127.0.0.1";
  const port = Number(process.env.PORT ?? 8787);
  const httpServer = createHttpServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

    if (request.method === "GET" && requestUrl.pathname === "/health") {
      response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ ok: true, server: "assera-plugin-server" }));
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/preview") {
      response.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      });
      response.end(buildWidgetHtml());
      return;
    }

    if (
      request.method === "GET" &&
      requestUrl.pathname === "/.well-known/openai-apps-challenge"
    ) {
      const challengeToken = process.env.OPENAI_APPS_CHALLENGE_TOKEN?.trim();
      if (!challengeToken) {
        response.writeHead(404).end("Not found");
        return;
      }

      response.writeHead(200, {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      });
      response.end(challengeToken);
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/mcp") {
      const server = createAsseraServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });

      response.on("close", () => {
        void transport.close();
        void server.close();
      });

      try {
        await server.connect(transport);
        await transport.handleRequest(request, response);
      } catch (error) {
        console.error("ASSERA MCP request failed:", error);
        if (!response.headersSent) {
          response.writeHead(500).end("Internal server error");
        }
      }
      return;
    }

    response.writeHead(404).end("Not found");
  });

  httpServer.listen(port, host, () => {
    console.error(`ASSERA Plugin MCP server listening on http://${host}:${port}/mcp`);
  });

  return httpServer;
}
