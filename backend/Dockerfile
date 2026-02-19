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

# Install Pandoc + LaTeX (XeLaTeX) + Ghostscript
# Note: pandoc-citeproc is built into pandoc since 2.11+, no separate package needed
RUN apt-get update && apt-get install -y \
    pandoc \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
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
    # fontconfig for runtime font probing (fc-list)
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

# Rebuild fontconfig cache so fc-list sees all TeX Live + system fonts
RUN fc-cache -fv

# App dir
WORKDIR /app

# Install server deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest (server code, templates, references)
COPY . .

# Expose API
EXPOSE 4000

# Start server
CMD ["node", "index.js"]