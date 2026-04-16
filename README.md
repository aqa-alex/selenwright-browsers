# selenwright-browsers

Docker images of Playwright browsers for [Selenwright](https://github.com/aqa-alex/selenwright). One image per browser, two modes via environment variables: headless for CI, headed + VNC for debugging.

## Images

| Directory | Browser | Ports |
|---|---|---|
| `playwright-chromium` | Chromium | 3000 (WS), 5900 (VNC), 9090 (clipboard) |
| `playwright-firefox` | Firefox | 3000 (WS), 5900 (VNC), 9090 (clipboard) |
| `playwright-webkit` | WebKit | 3000 (WS), 5900 (VNC), 9090 (clipboard) |

## Build

```bash
docker build -t playwright-chromium playwright-chromium/

# Specific Playwright version:
docker build --build-arg PLAYWRIGHT_VERSION=1.56.1 -t playwright-chromium playwright-chromium/
```

## Run

```bash
# CI — headless, no VNC
docker run -d -p 3000:3000 -e PW_HEADLESS=true -e ENABLE_VNC=false playwright-chromium

# Debug — headed + VNC, connect with a VNC client on port 5900
docker run -d -p 3000:3000 -p 5900:5900 -e PW_HEADLESS=false -e ENABLE_VNC=true playwright-chromium
```

## Connect from code

```javascript
import { chromium } from "playwright-core";

const browser = await chromium.connect("ws://localhost:3000/");
const page = await browser.newPage();
await page.goto("https://example.com");
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PW_HOST` | `0.0.0.0` | Playwright server host |
| `PW_PORT` | `3000` | Playwright server port |
| `PW_PATH` | `/` | WebSocket path |
| `PW_HEADLESS` | `false` | Headless mode (`true` for CI, `false` for debug) |
| `SCREEN_RESOLUTION` | `1920x1080x24` | Virtual screen resolution |
| `ENABLE_VNC` | `true` | Start x11vnc server (`false` to skip in CI) |
