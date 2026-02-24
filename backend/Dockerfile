# Use Ubuntu as base
FROM ubuntu:22.04

# Set environment variables to avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

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

# ── Download template fonts not reliably available as OTF in TeX Live 2021 ──
# TeX Live 2021 (Ubuntu 22.04) ships some fonts only as Type1 (.pfb), which
# fontconfig cannot index and LuaLaTeX's fontspec cannot reliably load.
# We download OTF/TTF versions directly from Google Fonts and CTAN to ensure
# every template font is available to both fontconfig and LuaLaTeX.
RUN apt-get update && apt-get install -y unzip && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /usr/local/share/fonts/pageperfect \
    && cd /tmp \
    # ── Google Fonts downloads ──
    # Alegreya Sans (paperback template)
    && curl -fsSL -o alegreya-sans.zip "https://fonts.google.com/download?family=Alegreya+Sans" \
    && unzip -qo alegreya-sans.zip -d /usr/local/share/fonts/pageperfect/alegreya-sans/ \
    # Fira Sans (exhibit, matrix, heirloom, operator templates)
    && curl -fsSL -o fira-sans.zip "https://fonts.google.com/download?family=Fira+Sans" \
    && unzip -qo fira-sans.zip -d /usr/local/share/fonts/pageperfect/fira-sans/ \
    # Fira Mono (chronicle, exhibit, heirloom, operator, matrix templates)
    && curl -fsSL -o fira-mono.zip "https://fonts.google.com/download?family=Fira+Mono" \
    && unzip -qo fira-mono.zip -d /usr/local/share/fonts/pageperfect/fira-mono/ \
    # Source Sans 3 (avantgarde template)
    && curl -fsSL -o source-sans-3.zip "https://fonts.google.com/download?family=Source+Sans+3" \
    && unzip -qo source-sans-3.zip -d /usr/local/share/fonts/pageperfect/source-sans-3/ \
    # Libre Baskerville (memoir template — Google Font, not in TeX Live)
    && curl -fsSL -o libre-baskerville.zip "https://fonts.google.com/download?family=Libre+Baskerville" \
    && unzip -qo libre-baskerville.zip -d /usr/local/share/fonts/pageperfect/libre-baskerville/ \
    # Scheherazade New (multilingual Arabic fallback)
    && curl -fsSL -o scheherazade-new.zip "https://fonts.google.com/download?family=Scheherazade+New" \
    && unzip -qo scheherazade-new.zip -d /usr/local/share/fonts/pageperfect/scheherazade-new/ \
    # ── CTAN / GitHub downloads (not on Google Fonts) ──
    # ETbb (chicago template — Bembo revival, TeX-specific)
    && curl -fsSL -o etbb.zip "https://mirrors.ctan.org/fonts/etbb.zip" \
    && unzip -qo etbb.zip "etbb/opentype/*" -d /tmp/etbb-extract/ \
    && cp /tmp/etbb-extract/etbb/opentype/*.otf /usr/local/share/fonts/pageperfect/ 2>/dev/null || true \
    && rm -rf /tmp/etbb-extract \
    # Libertinus Sans (symphony sans — OpenType math-aware family)
    && curl -fsSL -o libertinus.zip "https://github.com/alerque/libertinus/releases/download/v7.040/Libertinus-7.040.zip" \
    && unzip -qo libertinus.zip "Libertinus-7.040/static/OTF/LibertinusSans-*" -d /tmp/libertinus-extract/ \
    && cp /tmp/libertinus-extract/Libertinus-7.040/static/OTF/LibertinusSans-*.otf /usr/local/share/fonts/pageperfect/ 2>/dev/null || true \
    && rm -rf /tmp/libertinus-extract \
    # Cleanup
    && rm -f /tmp/*.zip \
    && rm -rf /tmp/etbb-extract /tmp/libertinus-extract

# ── Make all fonts visible to fontconfig and LuaLaTeX ──
# 1. Copy TeX Live fontconfig conf files (adds TeX font dirs)
# 2. Add explicit dirs for TeX Live OTF/TTF and our downloaded fonts
# 3. Rebuild fontconfig cache + luaotfload database
RUN cp /usr/share/texlive/texmf-dist/fontconfig/conf.avail/*.conf /etc/fonts/conf.d/ 2>/dev/null || true \
    && printf '<?xml version="1.0"?>\n<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">\n<fontconfig>\n  <dir>/usr/share/texlive/texmf-dist/fonts/opentype</dir>\n  <dir>/usr/share/texlive/texmf-dist/fonts/truetype</dir>\n  <dir>/usr/share/texmf/fonts/opentype</dir>\n  <dir>/usr/share/texmf/fonts/truetype</dir>\n  <dir>/usr/local/share/fonts/pageperfect</dir>\n</fontconfig>\n' > /etc/fonts/conf.d/99-texlive-fonts.conf \
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
