# Use Ubuntu as base
FROM ubuntu:22.04

# Set environment variables to avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies + locale support
# BELT AND SUSPENDERS: Generate en_US.UTF-8 AND default to C.UTF-8.
# C.UTF-8 is built into glibc (always available without locale-gen).
# en_US.UTF-8 is generated as insurance — if any tool doesn't recognize C.UTF-8,
# the compile-worker probes and falls back to en_US.UTF-8 automatically.
# LuaLaTeX's luaotfload calls os.setlocale("") which reads LANG — it MUST resolve
# to a valid locale or luaotfload exits with "Unable to read environment locale".
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    software-properties-common \
    locales \
    && locale-gen en_US.UTF-8 \
    && rm -rf /var/lib/apt/lists/*

ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

# Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Install Pandoc 3.6.2 from GitHub (Ubuntu 22.04 ships ancient 2.9)
# Pandoc 3.x has built-in --citeproc, better error handling, modern template syntax
RUN curl -fsSL -o /tmp/pandoc.deb \
    https://github.com/jgm/pandoc/releases/download/3.6.2/pandoc-3.6.2-1-amd64.deb \
    && dpkg -i /tmp/pandoc.deb \
    && rm /tmp/pandoc.deb

# Install LaTeX (LuaLaTeX + XeLaTeX) + Ghostscript
# LuaLaTeX is the primary PDF engine — generates PDFs directly without xdvipdfmx,
# avoiding the OpenType font embedding bugs in TeX Live 2021's xdvipdfmx driver.
# XeLaTeX kept as fallback.
# NOTE: TeX Live is pinned to Ubuntu 22.04's repo version (2021.20220204-1).
# To upgrade, bump the base image or pin via tlmgr after install.
RUN apt-get update && apt-get install -y \
    texlive-latex-base=2021.20220204-1 \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-luatex \
    texlive-xetex \
    texlive-latex-recommended \
    ghostscript \
    icc-profiles-free \
    # ── Font packages for PagePerfect templates ──
    # DejaVu family (Sans, Serif, Sans Mono) — used by 6+ templates
    fonts-dejavu \
    # Noto fonts — multilingual fallback (Arabic, CJK, Devanagari, Hebrew, Thai)
    fonts-noto-core \
    fonts-noto-cjk \
    fonts-noto-extra \
    # Arabic typography
    fonts-hosny-amiri \
    fonts-sil-scheherazade \
    # Cyrillic support
    fonts-paratype \
    # Emoji font — fallback for Unicode emoji in manuscripts
    fonts-noto-color-emoji \
    # fontconfig for runtime font probing (fc-list)
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

# ── Make TeX Live fonts visible to fontconfig (fc-list) ──
# TeX Live installs OpenType/TrueType fonts under /usr/share/texlive/texmf-dist/fonts/
# but fontconfig doesn't scan those directories by default. Without this, fc-list
# won't find ETbb, Alegreya Sans, Fira Sans, Source Sans Pro, Libertinus, etc.
# even though they're installed by texlive-fonts-extra.
RUN cp /usr/share/texlive/texmf-dist/fontconfig/conf.avail/*.conf /etc/fonts/conf.d/ 2>/dev/null || true \
    && printf '<?xml version="1.0"?>\n<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">\n<fontconfig>\n  <dir>/usr/share/texlive/texmf-dist/fonts/opentype</dir>\n  <dir>/usr/share/texlive/texmf-dist/fonts/truetype</dir>\n  <dir>/usr/share/texmf/fonts/opentype</dir>\n  <dir>/usr/share/texmf/fonts/truetype</dir>\n</fontconfig>\n' > /etc/fonts/conf.d/99-texlive-fonts.conf \
    && fc-cache -fv \
    && luaotfload-tool --update 2>/dev/null || true

# App dir
WORKDIR /app

# Install server deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest (server code, templates, references)
COPY . .

# SECURITY: Create non-root user for running the application.
# If an attacker gains code execution (e.g. via LaTeX injection),
# they will NOT have root privileges inside the container.
RUN groupadd -r ppuser && useradd -r -g ppuser -d /app ppuser \
    && chown -R ppuser:ppuser /app \
    && mkdir -p /tmp && chmod 1777 /tmp

# SECURITY: Make application code read-only to prevent tampering.
# /tmp and /var/cache/fontconfig remain writable for compilation and font caching.
RUN chmod -R a-w /app/templates /app/filters 2>/dev/null || true

# SECURITY: Set resource limits for compile processes in the ppuser profile.
# Pandoc/LuaLaTeX spawns inherit these limits to prevent resource exhaustion.
# - Max 512MB virtual memory per process (RLIMIT_AS)
# - Max 200 open file descriptors (RLIMIT_NOFILE)
# - Max 50 child processes (RLIMIT_NPROC)
RUN echo '* soft as 536870912' >> /etc/security/limits.d/ppuser.conf 2>/dev/null || true \
    && echo '* hard as 536870912' >> /etc/security/limits.d/ppuser.conf 2>/dev/null || true \
    && echo '* soft nofile 200' >> /etc/security/limits.d/ppuser.conf 2>/dev/null || true \
    && echo '* hard nofile 200' >> /etc/security/limits.d/ppuser.conf 2>/dev/null || true \
    && echo '* soft nproc 50' >> /etc/security/limits.d/ppuser.conf 2>/dev/null || true \
    && echo '* hard nproc 50' >> /etc/security/limits.d/ppuser.conf 2>/dev/null || true

USER ppuser

# Expose API
EXPOSE 4000

# Health check — verifies the HTTP server is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:4000/api/health || exit 1

# SECURITY: Recommended docker run flags for production:
#   docker run \
#     --cap-drop=ALL \
#     --security-opt=no-new-privileges \
#     --read-only --tmpfs /tmp:rw,noexec,nosuid,size=1024m \
#     --tmpfs /var/cache/fontconfig:rw,size=32m \
#     --memory=1g --memory-swap=1g \
#     --pids-limit=100 \
#     pageperfect-backend

# Start server — cap V8 heap to prevent unbounded memory growth under load
CMD ["node", "--max-old-space-size=512", "index.js"]
