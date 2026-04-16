# selenwright-browsers

Docker images of Playwright browsers for [Selenwright](https://github.com/aqa-alex/selenwright). Each browser is available in two variants: with VNC (for visual debugging) and without (lightweight headless).

## Images

| Directory | Browser | VNC | Headless | Ports |
|---|---|---|---|---|
| `playwright-chromium-vnc` | Chromium | yes | no | 3000 (WS), 5900 (VNC), 9090 (clipboard) |
| `playwright-firefox-vnc` | Firefox | yes | no | 3000 (WS), 5900 (VNC), 9090 (clipboard) |
| `playwright-webkit-vnc` | WebKit | yes | no | 3000 (WS), 5900 (VNC), 9090 (clipboard) |
| `playwright-chromium-novnc` | Chromium | no | yes | 3000 (WS) |
| `playwright-firefox-novnc` | Firefox | no | yes | 3000 (WS) |
| `playwright-webkit-novnc` | WebKit | no | yes | 3000 (WS) |

## Build

```bash
docker build -t playwright-chromium-vnc playwright-chromium-vnc/
docker build -t playwright-chromium-novnc playwright-chromium-novnc/

# Specific Playwright version:
docker build --build-arg PLAYWRIGHT_VERSION=1.56.1 -t playwright-chromium-novnc playwright-chromium-novnc/
```

## Run

```bash
# headless (no VNC)
docker run -d -p 3000:3000 playwright-chromium-novnc

# with VNC — connect with a VNC client on port 5900
docker run -d -p 3000:3000 -p 5900:5900 playwright-chromium-vnc
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
| `PW_HEADLESS` | `true` (novnc) / `false` (vnc) | Browser mode |
| `SCREEN_RESOLUTION` | `1920x1080x24` | Virtual screen resolution (vnc only) |
| `ENABLE_VNC` | `true` | Enable x11vnc (vnc only) |

## VNC vs No-VNC

**VNC** — full virtual display stack: Xvfb + fluxbox (WM) + x11vnc + clipboard service. The browser renders to a virtual screen accessible via any VNC client. Best for debugging and visual inspection.

**No-VNC** — Playwright server only, headless mode. No X11, no window manager, no VNC. Lighter, faster startup, lower resource usage. Best for CI/CD and production.
