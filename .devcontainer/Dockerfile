FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

# A real headless shell avoids Chromium's removed old-headless mode and a
# separate Chrome CDN download. Debian installs its shared-library dependencies.
USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        chromium-headless-shell ffmpeg rsync \
        fonts-noto-core fonts-noto-cjk fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

ENV SHOTCRAFT_BROWSER_EXECUTABLE=/usr/bin/chromium-headless-shell
USER node
