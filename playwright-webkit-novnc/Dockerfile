ARG PLAYWRIGHT_VERSION=1.56.1
FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble

ARG PLAYWRIGHT_VERSION

ENV PW_HOST=0.0.0.0 \
    PW_PORT=3000 \
    PW_PATH=/ \
    PW_HEADLESS=true

RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    dumb-init \
    netcat-openbsd \
 && npm install -g "playwright-core@${PLAYWRIGHT_VERSION}" \
 && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /opt/playwright

COPY --chown=pwuser:pwuser server.cjs /opt/playwright/server.cjs

USER pwuser

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD nc -z 127.0.0.1 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "/opt/playwright/server.cjs"]
