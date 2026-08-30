const FALLBACK_INFO = Object.freeze({
  name: "ASSERA",
  tagline: "A denial isn’t the final word.",
  site_url: "https://assera-webmcp.stanleyzebulonp.chatgpt.site",
  case_url: "https://assera-webmcp.stanleyzebulonp.chatgpt.site/case/NS-PA-48291",
  synthetic: true,
  webmcp: true,
  webmcp_tool_count: 7,
});

let demoInfo = { ...FALLBACK_INFO };
let rpcId = 0;
const pendingRequests = new Map();

function applyDemoInfo(response) {
  const content = response?.structuredContent;
  if (!content || content.name !== "ASSERA") return;

  demoInfo = { ...demoInfo, ...content };
  document.querySelector("[data-external='site']")?.setAttribute("href", demoInfo.site_url);
  document.querySelector("[data-external='case']")?.setAttribute("href", demoInfo.case_url);
  const tagline = document.querySelector("#assera-tagline");
  if (tagline) tagline.textContent = demoInfo.tagline;
}

function notifyHost(method, params) {
  window.parent.postMessage({ jsonrpc: "2.0", method, params }, "*");
}

function requestHost(method, params) {
  return new Promise((resolve, reject) => {
    const id = ++rpcId;
    pendingRequests.set(id, { resolve, reject });
    window.parent.postMessage({ jsonrpc: "2.0", id, method, params }, "*");
  });
}

window.addEventListener(
  "message",
  (event) => {
    if (event.source !== window.parent) return;
    const message = event.data;
    if (!message || message.jsonrpc !== "2.0") return;

    if (typeof message.id === "number") {
      const pending = pendingRequests.get(message.id);
      if (!pending) return;
      pendingRequests.delete(message.id);
      if (message.error) pending.reject(message.error);
      else pending.resolve(message.result);
      return;
    }

    if (message.method === "ui/notifications/tool-result") {
      applyDemoInfo(message.params);
    }
  },
  { passive: true },
);

async function initializeMcpAppsBridge() {
  if (window.parent === window) return;

  try {
    await requestHost("ui/initialize", {
      appInfo: { name: "assera-demo-widget", version: "0.1.0" },
      appCapabilities: {},
      protocolVersion: "2026-01-26",
    });
    notifyHost("ui/notifications/initialized", {});
  } catch (error) {
    console.error("Unable to initialize the MCP Apps bridge:", error);
  }
}

function applyTheme(theme) {
  if (theme === "dark" || theme === "light") {
    document.documentElement.dataset.theme = theme;
  }
}

window.addEventListener(
  "openai:set_globals",
  (event) => applyTheme(event.detail?.globals?.theme),
  { passive: true },
);
applyTheme(new URLSearchParams(window.location.search).get("theme"));
applyTheme(window.openai?.theme);

document.querySelectorAll("[data-external]").forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");
    if (!href || typeof window.openai?.openExternal !== "function") return;
    event.preventDefault();
    window.openai.openExternal({ href });
  });
});

applyDemoInfo({ structuredContent: FALLBACK_INFO });
void initializeMcpAppsBridge();
