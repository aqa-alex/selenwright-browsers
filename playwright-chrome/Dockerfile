ARG PLAYWRIGHT_VERSION=1.58.0
FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble

ARG PLAYWRIGHT_VERSION
ARG BUILD_DATE
ARG VCS_REF

ENV PW_HOST=0.0.0.0 \
    PW_PORT=3000 \
    PW_PATH=/ \
    PW_HEADLESS=false \
    PW_BROWSER_TYPE=chromium \
    PW_BROWSER_NAME="Google Chrome" \
    PW_BROWSER_CHANNEL=chrome \
    PW_EXECUTABLE_PATH_ENV=PW_CHROME_EXECUTABLE_PATH \
    DISPLAY=:99 \
    DISPLAY_NUM=99

RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    dumb-init \
    fluxbox \
    inotify-tools \
    netcat-openbsd \
    x11-utils \
    x11vnc \
    xclip \
    xvfb \
 && npm install -g "playwright-core@${PLAYWRIGHT_VERSION}" \
 && npx playwright-core install --with-deps chrome \
 && rm -rf /var/lib/apt/lists/* /root/.npm

RUN mkdir -p /opt/playwright /tmp/.X11-unix \
 && chmod 1777 /tmp/.X11-unix \
 && mkdir -p /home/pwuser/Downloads /home/pwuser/Captures \
 && chown pwuser:pwuser /home/pwuser/Downloads /home/pwuser/Captures

COPY --chown=pwuser:pwuser shared/server.cjs /opt/playwright/server.cjs
COPY --chown=pwuser:pwuser shared/clipboard.cjs /opt/playwright/clipboard.cjs
COPY --chown=pwuser:pwuser shared/entrypoint.sh /opt/playwright/entrypoint.sh

RUN chmod +x /opt/playwright/entrypoint.sh

USER pwuser

EXPOSE 3000 5900 9090

LABEL org.opencontainers.image.title="selenwright/playwright-chrome" \
      org.opencontainers.image.description="Google Chrome Playwright browser image for Selenwright" \
      org.opencontainers.image.url="https://github.com/aqa-alex/selenwright-browsers" \
      org.opencontainers.image.source="https://github.com/aqa-alex/selenwright-browsers" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.version="${PLAYWRIGHT_VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.licenses="Apache-2.0" \
      io.selenwright.browser="chrome" \
      io.selenwright.version="${PLAYWRIGHT_VERSION}" \
      io.selenwright.port="3000" \
      io.selenwright.path="/" \
      io.selenwright.protocol="playwright" \
      io.selenwright.default="false" \
      io.selenwright.tmpfs='{"/tmp":"size=512m"}' \
      io.selenwright.env='["PW_DOWNLOADS_PATH=/home/pwuser/Downloads","SELENWRIGHT_DOWNLOADS_DIR=/home/pwuser/Captures"]'

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD nc -z 127.0.0.1 3000

ENTRYPOINT ["dumb-init", "--", "/opt/playwright/entrypoint.sh"]
CMD ["node", "/opt/playwright/server.cjs"]
