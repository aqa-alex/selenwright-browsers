ARG PLAYWRIGHT_VERSION=1.56.1
FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble

ARG PLAYWRIGHT_VERSION

ENV PW_HOST=0.0.0.0 \
    PW_PORT=3000 \
    PW_PATH=/ \
    PW_HEADLESS=false \
    DISPLAY=:99 \
    DISPLAY_NUM=99
# Intentionally NOT setting SCREEN_RESOLUTION or ENABLE_VNC here — Selenwright
# always passes them per-container, so any value hardcoded at image level would
# be silently overridden. Defaults for standalone runs live in entrypoint.sh.

RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    dumb-init \
    fluxbox \
    netcat-openbsd \
    x11-utils \
    x11vnc \
    xclip \
    xvfb \
 && npm install -g "playwright-core@${PLAYWRIGHT_VERSION}" \
 && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /opt/playwright /tmp/.X11-unix \
 && chmod 1777 /tmp/.X11-unix \
 && mkdir -p /home/pwuser/Downloads \
 && chown pwuser:pwuser /home/pwuser/Downloads

COPY --chown=pwuser:pwuser server.cjs /opt/playwright/server.cjs
COPY --chown=pwuser:pwuser clipboard.cjs /opt/playwright/clipboard.cjs
COPY --chown=pwuser:pwuser entrypoint.sh /opt/playwright/entrypoint.sh

RUN chmod +x /opt/playwright/entrypoint.sh

USER pwuser

EXPOSE 3000 5900 9090

LABEL io.selenwright.browser="firefox" \
      io.selenwright.version="1.56.1" \
      io.selenwright.port="3000" \
      io.selenwright.path="/" \
      io.selenwright.protocol="playwright" \
      io.selenwright.default="false" \
      io.selenwright.tmpfs='{"/tmp":"size=512m"}' \
      io.selenwright.env='["SELENWRIGHT_DOWNLOADS_DIR=/home/pwuser/Downloads"]'

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD nc -z 127.0.0.1 3000

ENTRYPOINT ["dumb-init", "--", "/opt/playwright/entrypoint.sh"]
CMD ["node", "/opt/playwright/server.cjs"]
