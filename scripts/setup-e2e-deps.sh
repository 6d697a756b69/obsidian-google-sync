#!/usr/bin/env bash
# Install the system packages needed to launch a real Obsidian (Electron) headlessly
# for the wdio e2e tests on Debian/Ubuntu. Idempotent.
#
# Ubuntu 24.04 (noble) uses the `t64` ABI-transition package names for several libs.
set -euo pipefail

sudo apt-get update -qq
sudo apt-get install -y \
    xvfb \
    libfuse2t64 \
    libnotify4 \
    libsecret-1-0 \
    libatk1.0-0t64 \
    libatk-bridge2.0-0t64 \
    libatspi2.0-0t64 \
    libcups2t64 \
    libgtk-3-0t64 \
    libnss3 \
    libasound2t64 \
    libgbm1 \
    libxss1 \
    libxshmfence1 \
    libgdk-pixbuf-2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libpango-1.0-0 \
    libcairo2

echo "e2e system dependencies installed."
