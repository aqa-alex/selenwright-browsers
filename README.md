# selenwright-browsers

Docker images of Playwright browsers for [Selenwright](https://github.com/aqa-alex/selenwright). One image per browser, two modes via environment variables: headless for CI, headed + VNC for debugging.

Published images are available on [Docker Hub under `selenwright`](https://hub.docker.com/u/selenwright).

## Images

| Directory | Browser | Docker image | Ports |
|---|---|---|---|
| `playwright-chromium` | Chromium | [`selenwright/playwright-chromium`](https://hub.docker.com/r/selenwright/playwright-chromium) | 3000 (WS), 5900 (VNC), 9090 (clipboard) |
| `playwright-firefox` | Firefox | [`selenwright/playwright-firefox`](https://hub.docker.com/r/selenwright/playwright-firefox) | 3000 (WS), 5900 (VNC), 9090 (clipboard) |
| `playwright-webkit` | WebKit | [`selenwright/playwright-webkit`](https://hub.docker.com/r/selenwright/playwright-webkit) | 3000 (WS), 5900 (VNC), 9090 (clipboard) |

## Pull

```bash
docker pull selenwright/playwright-chromium:latest
docker pull selenwright/playwright-firefox:latest
docker pull selenwright/playwright-webkit:latest
```

## Build

```bash
docker build -t playwright-chromium playwright-chromium/

# Specific Playwright version:
docker build --build-arg PLAYWRIGHT_VERSION=1.58.0 -t playwright-chromium playwright-chromium/
```

## Run

```bash
# CI - headless, no VNC
docker run -d -p 3000:3000 -e PW_HEADLESS=true -e ENABLE_VNC=false selenwright/playwright-chromium:latest

# Debug - headed + VNC, connect with a VNC client on port 5900
docker run -d -p 3000:3000 -p 5900:5900 -e PW_HEADLESS=false -e ENABLE_VNC=true selenwright/playwright-chromium:latest
```

## Connect from code

```javascript
import { chromium } from "playwright-core";

const browser = await chromium.connect("ws://localhost:3000/");
const page = await browser.newPage();
await page.goto("https://example.com");
```

Playwright client and server versions must match by major and minor version.

## Clipboard

The container exposes a small HTTP clipboard helper on port `9090`.

```bash
# Read clipboard
curl http://localhost:9090/

# Write clipboard
printf 'hello from test' | curl -X POST --data-binary @- http://localhost:9090/
```

## Downloads

Set `PW_DOWNLOADS_PATH` to control Playwright's download directory. Set `SELENWRIGHT_DOWNLOADS_DIR` to mirror completed downloads into a mounted directory.

```bash
mkdir -p ./downloads

docker run -d \
  -p 3000:3000 \
  -e PW_DOWNLOADS_PATH=/home/pwuser/Downloads \
  -e SELENWRIGHT_DOWNLOADS_DIR=/home/pwuser/Captures \
  -v "$(pwd)/downloads:/home/pwuser/Captures" \
  selenwright/playwright-chromium:latest
```

## Docker Compose

```yaml
services:
  chromium:
    image: selenwright/playwright-chromium:latest
    ports:
      - "3000:3000"
      - "5900:5900"
      - "9090:9090"
    environment:
      PW_HEADLESS: "false"
      ENABLE_VNC: "true"
      PW_DOWNLOADS_PATH: /home/pwuser/Downloads
      SELENWRIGHT_DOWNLOADS_DIR: /home/pwuser/Captures
    volumes:
      - ./downloads:/home/pwuser/Captures
    tmpfs:
      - /tmp:size=512m
```

## Healthcheck

Images include a Docker healthcheck that waits for the Playwright server on `127.0.0.1:3000`.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PW_HOST` | `0.0.0.0` | Playwright server host |
| `PW_PORT` | `3000` | Playwright server port |
| `PW_PATH` | `/` | WebSocket path |
| `PW_HEADLESS` | `false` | Headless mode (`true` for CI, `false` for debug) |
| `SCREEN_RESOLUTION` | `1920x1080x24` | Virtual screen resolution |
| `ENABLE_VNC` | `true` | Start x11vnc server (`false` to skip in CI) |
| `PW_DOWNLOADS_PATH` | unset | Playwright downloads directory |
| `SELENWRIGHT_DOWNLOADS_DIR` | unset | Directory where completed downloads are mirrored |
| `CLIPBOARD_HOST` | `0.0.0.0` | Clipboard helper host |
| `CLIPBOARD_PORT` | `9090` | Clipboard helper port |
| `CLIPBOARD_MAX_BYTES` | `1048576` | Maximum clipboard request body size |
| `CLIPBOARD_SELECTION` | `clipboard` | X11 clipboard selection |
| `PW_CHROMIUM_EXECUTABLE_PATH` | unset | Override Chromium executable path |
| `PW_FIREFOX_EXECUTABLE_PATH` | unset | Override Firefox executable path |
| `PW_WEBKIT_EXECUTABLE_PATH` | unset | Override WebKit executable path |

## Security

VNC starts without a password when `ENABLE_VNC=true`. Bind port `5900` only to trusted networks or keep it disabled in CI.

## License

Apache 2.0 - see [LICENSE](LICENSE).
