"use strict";

const http = require("node:http");
const { spawn, spawnSync } = require("node:child_process");

function parseIntegerEnv(name, defaultValue, { min, max }) {
  const raw = process.env[name] || String(defaultValue);
  if (!/^\d+$/.test(raw)) {
    throw new Error(`${name} must be an integer`);
  }

  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}`);
  }

  return value;
}

const PORT = parseIntegerEnv("CLIPBOARD_PORT", 9090, { min: 1, max: 65535 });
const HOST = process.env.CLIPBOARD_HOST || "0.0.0.0";
const MAX_BYTES = parseIntegerEnv("CLIPBOARD_MAX_BYTES", 1048576, { min: 1, max: 104857600 });
const SELECTION = process.env.CLIPBOARD_SELECTION || "clipboard";
const DISPLAY = process.env.DISPLAY || ":99";
const SPAWN_ENV = { ...process.env, DISPLAY };

function readClipboard() {
  const result = spawnSync("xclip", ["-selection", SELECTION, "-out"], {
    encoding: "utf8",
    env: SPAWN_ENV,
  });
  if (result.error) {
    throw result.error;
  }
  return result.stdout || "";
}

function writeClipboard(text) {
  const child = spawn("xclip", ["-selection", SELECTION, "-in"], {
    env: SPAWN_ENV,
    stdio: ["pipe", "ignore", "ignore"],
  });
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0 || code === null) {
        resolve();
      } else {
        reject(new Error(`xclip exited with code ${code}`));
      }
    });
    child.stdin.end(text, "utf8");
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" || req.method === "HEAD") {
      const text = readClipboard();
      res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(req.method === "HEAD" ? undefined : text);
      return;
    }

    if (req.method === "POST" || req.method === "PUT") {
      const declaredLength = Number.parseInt(req.headers["content-length"] || "0", 10);
      if (Number.isFinite(declaredLength) && declaredLength > MAX_BYTES) {
        res.writeHead(413, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(`body exceeds ${MAX_BYTES} bytes`);
        return;
      }

      const chunks = [];
      let total = 0;
      for await (const chunk of req) {
        total += chunk.length;
        if (total > MAX_BYTES) {
          res.writeHead(413, { "Content-Type": "text/plain; charset=utf-8" });
          res.end(`body exceeds ${MAX_BYTES} bytes`);
          return;
        }
        chunks.push(chunk);
      }

      await writeClipboard(Buffer.concat(chunks).toString("utf8"));
      res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end();
      return;
    }

    res.writeHead(405, { Allow: "GET, HEAD, POST, PUT", "Content-Type": "text/plain; charset=utf-8" });
    res.end("method not allowed");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`clipboard error: ${message}`);
  }
});

server.on("clientError", (err, socket) => {
  if (!socket.destroyed) {
    socket.destroy();
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[clipboard] listening on ${HOST}:${PORT} selection=${SELECTION} display=${DISPLAY}`);
});

function shutdown(signal) {
  console.log(`[clipboard] ${signal} received, shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 500).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
