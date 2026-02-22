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
RUN apt-get update && apt-get install -y \
    texlive-latex-base \
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

# Rebuild fontconfig cache and TeX font maps so all fonts are visible
# to both fontconfig (fc-list) and LuaLaTeX/XeLaTeX (fontspec).
RUN cp /usr/share/texlive/texmf-dist/fontconfig/conf.avail/*.conf /etc/fonts/conf.d/ 2>/dev/null || true \
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

USER ppuser

# Expose API
EXPOSE 4000

# Health check — verifies the HTTP server is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:4000/api/health || exit 1

# Start server
CMD ["node", "index.js"]
