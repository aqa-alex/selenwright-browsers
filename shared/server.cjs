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

function env(name, defaultValue = "") {
  const value = process.env[name];
  return typeof value === "string" && value.length > 0 ? value : defaultValue;
}

function parseBoolean(name, defaultValue) {
  const value = process.env[name];
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
      throw new Error(`${name} must be a boolean value`);
  }
}

function parsePort(name, defaultValue) {
  const raw = env(name, String(defaultValue));
  if (!/^\d+$/.test(raw)) {
    throw new Error(`${name} must be an integer port`);
  }

  const port = Number(raw);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name} must be between 1 and 65535`);
  }

  return port;
}

function parseScreenResolution(name) {
  const value = process.env[name];
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  const match = /^(\d+)x(\d+)(?:x\d+)?$/.exec(value.trim());
  if (!match) {
    throw new Error(`${name} must match WIDTHxHEIGHT or WIDTHxHEIGHTxDEPTH`);
  }

  const width = Number(match[1]);
  const height = Number(match[2]);
  if (width < 1 || height < 1) {
    throw new Error(`${name} width and height must be positive`);
  }

  return { width, height };
}

const playwright = loadPlaywright();
const browserTypeName = env("PW_BROWSER_TYPE");
const browserType = playwright[browserTypeName];
if (!browserType || typeof browserType.launchServer !== "function") {
  throw new Error(`PW_BROWSER_TYPE must be one of: chromium, firefox, webkit`);
}

const browserName = env("PW_BROWSER_NAME", browserTypeName);
const channel = env("PW_BROWSER_CHANNEL");
const executablePathEnv = env("PW_EXECUTABLE_PATH_ENV");
const executablePath = executablePathEnv ? env(executablePathEnv) : "";
const host = env("PW_HOST", "0.0.0.0");
const port = parsePort("PW_PORT", 3000);
const wsPath = env("PW_PATH", "/");
const headless = parseBoolean("PW_HEADLESS", false);

const launchOptions = {
  headless,
  host,
  port,
  wsPath,
};

if (browserTypeName === "chromium") {
  launchOptions.args = [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
  ];

  const screenSize = parseScreenResolution("SCREEN_RESOLUTION");
  if (screenSize) {
    launchOptions.args.push(`--window-size=${screenSize.width},${screenSize.height}`);
  }
}

if (channel) {
  launchOptions.channel = channel;
}

if (executablePath) {
  delete launchOptions.channel;
  launchOptions.executablePath = executablePath;
}

const downloadsPath = env("PW_DOWNLOADS_PATH");
if (downloadsPath) {
  launchOptions.downloadsPath = downloadsPath;
}

async function main() {
  const server = await browserType.launchServer(launchOptions);

  console.log(
    `Playwright ${browserName} server listening at ${server.wsEndpoint()} (headless=${headless}, display=${process.env.DISPLAY || "unset"})`,
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
  console.error(`Failed to start Playwright ${browserName} server:`, error);
  process.exit(1);
});
