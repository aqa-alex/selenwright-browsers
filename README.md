# selenwright-browsers

Docker images of Playwright browsers for [Selenwright](https://github.com/aqa-alex/selenwright). Two image families per browser: full images with X11/VNC/clipboard for headed debugging, and headless images without any X11 stack for lean CI use.

Published images are available on [Docker Hub under `selenwright`](https://hub.docker.com/u/selenwright).

## Images

### Full images (headed + VNC + clipboard)

| Directory | Browser | Docker image | Ports |
|---|---|---|---|
| `playwright-chromium` | Chromium | [`selenwright/playwright-chromium`](https://hub.docker.com/r/selenwright/playwright-chromium) | 3000 (WS), 5900 (VNC), 9090 (clipboard) |
| `playwright-firefox` | Firefox | [`selenwright/playwright-firefox`](https://hub.docker.com/r/selenwright/playwright-firefox) | 3000 (WS), 5900 (VNC), 9090 (clipboard) |
| `playwright-webkit` | WebKit | [`selenwright/playwright-webkit`](https://hub.docker.com/r/selenwright/playwright-webkit) | 3000 (WS), 5900 (VNC), 9090 (clipboard) |
| `playwright-chrome` | Google Chrome | [`selenwright/playwright-chrome`](https://hub.docker.com/r/selenwright/playwright-chrome) | 3000 (WS), 5900 (VNC), 9090 (clipboard) |
| `playwright-msedge` | Microsoft Edge | [`selenwright/playwright-msedge`](https://hub.docker.com/r/selenwright/playwright-msedge) | 3000 (WS), 5900 (VNC), 9090 (clipboard) |

### Headless images (CI-optimized, no X11 stack)

Same Docker Hub repositories, `-headless` tag suffix. No Xvfb, VNC, or clipboard service — browser runs headless only.

| Directory | Browser | Docker image | Port | Tags |
|---|---|---|---|---|
| `playwright-chromium` | Chromium | [`selenwright/playwright-chromium`](https://hub.docker.com/r/selenwright/playwright-chromium) | 3000 (WS) | `latest-headless`, `1.58-headless`, … |
| `playwright-firefox` | Firefox | [`selenwright/playwright-firefox`](https://hub.docker.com/r/selenwright/playwright-firefox) | 3000 (WS) | `latest-headless`, `1.58-headless`, … |
| `playwright-webkit` | WebKit | [`selenwright/playwright-webkit`](https://hub.docker.com/r/selenwright/playwright-webkit) | 3000 (WS) | `latest-headless`, `1.58-headless`, … |
| `playwright-chrome` | Google Chrome | [`selenwright/playwright-chrome`](https://hub.docker.com/r/selenwright/playwright-chrome) | 3000 (WS) | `latest-headless`, `1.58-headless`, … |
| `playwright-msedge` | Microsoft Edge | [`selenwright/playwright-msedge`](https://hub.docker.com/r/selenwright/playwright-msedge) | 3000 (WS) | `latest-headless`, `1.58-headless`, … |

## Supported Architectures

| Browser | linux/amd64 | linux/arm64 |
|---|---|---|
| Chromium | yes | yes |
| Firefox | yes | yes |
| WebKit | yes | yes |
| Google Chrome | yes | no |
| Microsoft Edge | yes | no |

Both full and headless images follow the same architecture support per browser.

## Pull

```bash
# Full images
docker pull selenwright/playwright-chromium:latest
docker pull selenwright/playwright-firefox:latest
docker pull selenwright/playwright-webkit:latest
docker pull selenwright/playwright-chrome:latest
docker pull selenwright/playwright-msedge:latest

# Headless images
docker pull selenwright/playwright-chromium:latest-headless
docker pull selenwright/playwright-firefox:latest-headless
docker pull selenwright/playwright-webkit:latest-headless
docker pull selenwright/playwright-chrome:latest-headless
docker pull selenwright/playwright-msedge:latest-headless
```

## Tags

Images are published for the latest two stable Playwright minor versions.

Each full image gets:

- the full Playwright version tag, for example `1.58.0`
- the Playwright minor tag, for example `1.58`
- `latest` and `latest-release` for the newest discovered stable version

Each headless image gets the same tags with a `-headless` suffix: `1.58.0-headless`, `1.58-headless`, `latest-headless`, `latest-release-headless`.

Chromium, Firefox, and WebKit are pinned by the Playwright version tag. Google Chrome and Microsoft Edge images pin the Playwright version, while the branded browser binary follows the current stable package installed by Playwright during the image build.

## Build

```bash
# Full image
docker build -f playwright-chromium/Dockerfile -t playwright-chromium .

# Headless image
docker build -f playwright-chromium/Dockerfile.headless -t playwright-chromium:headless .

# Specific Playwright version:
docker build -f playwright-chromium/Dockerfile --build-arg PLAYWRIGHT_VERSION=1.58.0 -t playwright-chromium .
```

## Run

```bash
# CI - headless image (no X11 stack, smallest footprint)
docker run -d -p 3000:3000 selenwright/playwright-chromium:latest-headless

# CI - full image in headless mode
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
Google Chrome and Microsoft Edge images use Playwright's `chromium` client.

## Clipboard

The full image exposes a small HTTP clipboard helper on port `9090`. Not available in headless images.

```bash
# Read clipboard
curl http://localhost:9090/

# Write clipboard
printf 'hello from test' | curl -X POST --data-binary @- http://localhost:9090/
```

## Downloads

Set `PW_DOWNLOADS_PATH` to control Playwright's download directory. Set `SELENWRIGHT_DOWNLOADS_DIR` to mirror completed downloads into a mounted directory. Both full and headless images support this feature.

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

  chromium-headless:
    image: selenwright/playwright-chromium:latest-headless
    ports:
      - "3000:3000"
    environment:
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

### Full images

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
| `PW_CHROME_EXECUTABLE_PATH` | unset | Override Google Chrome executable path |
| `PW_MSEDGE_EXECUTABLE_PATH` | unset | Override Microsoft Edge executable path |

### Headless images

`PW_HEADLESS` is hardcoded to `true` and cannot be changed. `SCREEN_RESOLUTION`, `ENABLE_VNC`, `DISPLAY`, `DISPLAY_NUM`, and all `CLIPBOARD_*` variables are not applicable.

| Variable | Default | Description |
|---|---|---|
| `PW_HOST` | `0.0.0.0` | Playwright server host |
| `PW_PORT` | `3000` | Playwright server port |
| `PW_PATH` | `/` | WebSocket path |
| `PW_DOWNLOADS_PATH` | unset | Playwright downloads directory |
| `SELENWRIGHT_DOWNLOADS_DIR` | unset | Directory where completed downloads are mirrored |
| `PW_CHROMIUM_EXECUTABLE_PATH` | unset | Override Chromium executable path |
| `PW_FIREFOX_EXECUTABLE_PATH` | unset | Override Firefox executable path |
| `PW_WEBKIT_EXECUTABLE_PATH` | unset | Override WebKit executable path |
| `PW_CHROME_EXECUTABLE_PATH` | unset | Override Google Chrome executable path |
| `PW_MSEDGE_EXECUTABLE_PATH` | unset | Override Microsoft Edge executable path |

## Security

VNC starts without a password when `ENABLE_VNC=true`. Bind port `5900` only to trusted networks or keep it disabled in CI.

## License

Apache 2.0 - see [LICENSE](LICENSE).
