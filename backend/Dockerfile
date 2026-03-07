# Use Ubuntu as base
FROM ubuntu:22.04

# Set environment variables to avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# ── Layer 1: Base tools (curl, wget) ──
# LOCALE: C.UTF-8 is built into glibc on Debian/Ubuntu — no locale-gen needed.
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

# ── Layer 2: Fonts + Ghostscript (~700MB, changes rarely) ──
# This layer is placed BEFORE Node/Pandoc/Typst so that version bumps
# to those tools don't invalidate the expensive font download cache.
RUN apt-get update && apt-get install -y \
    ghostscript \
    icc-profiles-free \
    # ── Font packages for PagePerfect templates ──
    # TeX Live font packages (contain ETbb, Alegreya, Fira, EB Garamond, etc.)
    texlive-fonts-recommended \
    texlive-fonts-extra \
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

# ── Make TeX Live fonts visible to fontconfig ──
# texlive-fonts-* installs fonts under /usr/share/texlive/texmf-dist/fonts/
# but fontconfig doesn't scan those directories by default.
RUN cp /usr/share/texlive/texmf-dist/fontconfig/conf.avail/*.conf /etc/fonts/conf.d/ 2>/dev/null || true \
    && printf '<?xml version="1.0"?>\n<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">\n<fontconfig>\n  <dir>/usr/share/texlive/texmf-dist/fonts/opentype</dir>\n  <dir>/usr/share/texlive/texmf-dist/fonts/truetype</dir>\n  <dir>/usr/share/texmf/fonts/opentype</dir>\n  <dir>/usr/share/texmf/fonts/truetype</dir>\n</fontconfig>\n' > /etc/fonts/conf.d/99-texlive-fonts.conf \
    && fc-cache -fv

# ── Layer 3: Node.js 20 LTS ──
# Direct binary from nodejs.org — no third-party repo needed.
RUN NODE_VERSION="20.18.1" \
    && curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" \
        | tar -xJ -C /usr/local --strip-components=1 \
    && node --version && npm --version

# ── Layer 4: Pandoc 3.6.2 ──
# Ubuntu 22.04 ships ancient 2.9; we need 3.x for --citeproc and modern template syntax.
RUN curl -fsSL -o /tmp/pandoc.deb \
    https://github.com/jgm/pandoc/releases/download/3.6.2/pandoc-3.6.2-1-amd64.deb \
    && dpkg -i /tmp/pandoc.deb \
    && rm /tmp/pandoc.deb

# ── Layer 5: Typst ──
# Modern typesetting engine — Knuth-Plass line-breaking, ~27x faster than TeX.
# Reads fonts from system fontconfig dirs + any --font-path arguments.
RUN TYPST_VERSION="0.13.1" \
    && curl -fsSL -o /tmp/typst.tar.xz \
       "https://github.com/typst/typst/releases/download/v${TYPST_VERSION}/typst-x86_64-unknown-linux-musl.tar.xz" \
    && tar -xf /tmp/typst.tar.xz -C /tmp \
    && mv /tmp/typst-x86_64-unknown-linux-musl/typst /usr/local/bin/typst \
    && chmod +x /usr/local/bin/typst \
    && rm -rf /tmp/typst* \
    && typst --version

# App dir
WORKDIR /app

# ── Layer 6: npm dependencies (changes with package-lock.json) ──
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest (server code, templates, references)
COPY . .

# SECURITY: Create non-root user for running the application.
RUN groupadd -r ppuser && useradd -r -g ppuser -d /app ppuser \
    && chown -R ppuser:ppuser /app \
    && mkdir -p /tmp && chmod 1777 /tmp

# SECURITY: Make application code read-only to prevent tampering.
# /tmp and /var/cache/fontconfig remain writable for compilation and font caching.
RUN chmod -R a-w /app/templates /app/typst-templates /app/filters 2>/dev/null || true

# SECURITY: Set resource limits for compile processes in the ppuser profile.
# Pandoc/Typst spawns inherit these limits to prevent resource exhaustion.
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
#     --network none \
#     pageperfect-backend
#
# NOTE: --network none isolates the container from all network access.
# The compile worker trusts enqueue-time tier verification, so it does
# not need network access. If Redis/PocketBase are on the same host,
# use a dedicated Docker network instead of --network none.

# Start server — cap V8 heap to prevent unbounded memory growth under load
CMD ["node", "--max-old-space-size=512", "index.js"]
