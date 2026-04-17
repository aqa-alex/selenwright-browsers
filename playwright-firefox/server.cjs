function loadPlaywright() {
  for (const moduleName of [
    "playwright-core",
    "playwright",
    "/usr/lib/node_modules/playwright-core",
    "/usr/local/lib/node_modules/playwright-core",
  ]) {
    try {
      return require(moduleName);
    } catch (error) {
      if (error && error.code !== "MODULE_NOT_FOUND") {
        throw error;
      }
    }
  }

  throw new Error("Playwright module is not available in the container");
}

const { firefox } = loadPlaywright();

const host = process.env.PW_HOST || "0.0.0.0";
const port = Number(process.env.PW_PORT || 3000);
const wsPath = process.env.PW_PATH || "/";
const executablePath = process.env.PW_FIREFOX_EXECUTABLE_PATH || "";
const headless = parseBoolean(process.env.PW_HEADLESS, false);

function parseBoolean(value, defaultValue) {
  if (typeof value !== "string" || value.length === 0) {
    return defaultValue;
  }

  switch (value.toLowerCase()) {
    case "1":
    case "true":
    case "yes":
    case "on":
      return true;
    case "0":
    case "false":
    case "no":
    case "off":
      return false;
    default:
      return defaultValue;
  }
}

async function main() {
  const launchOptions = {
    headless,
    host,
    port,
    wsPath,
  };

  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }

  const downloadsPath = process.env.SELENWRIGHT_DOWNLOADS_DIR || "";
  if (downloadsPath) {
    launchOptions.downloadsPath = downloadsPath;
  }

  const server = await firefox.launchServer(launchOptions);

  console.log(
    `Playwright Firefox server listening at ${server.wsEndpoint()} (headless=${headless}, display=${process.env.DISPLAY || "unset"})`,
  );

  const shutdown = async () => {
    try {
      await server.close();
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await new Promise(() => {});
}

main().catch((error) => {
  console.error("Failed to start Playwright Firefox server:", error);
  process.exit(1);
});
