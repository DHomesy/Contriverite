import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const publicFiles = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/script.js", ["script.js", "text/javascript; charset=utf-8"]],
  ["/favicon.svg", ["favicon.svg", "image/svg+xml"]],
]);

export function getListenOptions(env = process.env) {
  const port = Number(env.PORT ?? 5173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }
  const host = env.HOST ?? (env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");
  return { port, host };
}

export function createSiteServer() {
  return createServer(async (request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD", "Content-Type": "text/plain; charset=utf-8" });
      response.end("Method not allowed");
      return;
    }

    const pathname = request.url.split("?")[0];
    const file = publicFiles.get(pathname);
    if (!file) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    try {
      const content = await readFile(new URL(file[0], import.meta.url));
      response.writeHead(200, {
        "Content-Type": file[1],
        "Content-Length": content.length,
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Cache-Control": "no-cache",
      });
      response.end(request.method === "HEAD" ? undefined : content);
    } catch (error) {
      console.error(`Unable to serve ${pathname}:`, error);
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Unable to load this page");
    }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { port, host } = getListenOptions();
  const server = createSiteServer();
  server.on("error", (error) => {
    console.error("Unable to start Contriverite:", error.message);
    process.exitCode = 1;
  });
  server.listen(port, host, () => {
    console.log(`Contriverite is listening on ${host}:${port}`);
  });
  process.once("SIGTERM", () => {
    server.close((error) => {
      if (error) {
        console.error("Unable to shut down Contriverite cleanly:", error.message);
        process.exitCode = 1;
      }
    });
  });
}
