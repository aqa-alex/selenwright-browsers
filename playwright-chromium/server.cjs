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

const { chromium } = loadPlaywright();

const host = process.env.PW_HOST || "0.0.0.0";
const port = Number(process.env.PW_PORT || 3000);
const wsPath = process.env.PW_PATH || "/";
const executablePath = process.env.PW_CHROMIUM_EXECUTABLE_PATH || "";
const headless = parseBoolean(process.env.PW_HEADLESS, false);

const defaultArgs = [
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
];

const screenSize = parseScreenResolution(process.env.SCREEN_RESOLUTION);
if (screenSize) {
  defaultArgs.push(`--window-size=${screenSize.width},${screenSize.height}`);
}

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

function parseScreenResolution(value) {
  if (typeof value !== "string") {
    return null;
  }

  const match = /^(\d+)x(\d+)(?:x\d+)?$/.exec(value.trim());
  if (!match) {
    return null;
  }

  return {
    width: Number(match[1]),
    height: Number(match[2]),
  };
}

async function main() {
  const launchOptions = {
    headless,
    host,
    port,
    wsPath,
    args: defaultArgs,
  };

  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }

  const downloadsPath = process.env.PW_DOWNLOADS_PATH || "";
  if (downloadsPath) {
    launchOptions.downloadsPath = downloadsPath;
  }

  const server = await chromium.launchServer(launchOptions);

  console.log(
    `Playwright Chromium server listening at ${server.wsEndpoint()} (headless=${headless}, display=${process.env.DISPLAY || "unset"})`,
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
  console.error("Failed to start Playwright Chromium server:", error);
  process.exit(1);
});
