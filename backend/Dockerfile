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

# Install Pandoc and pandoc-citeproc
RUN apt-get update && apt-get install -y pandoc pandoc-citeproc

# Install LaTeX with XeLaTeX support
RUN apt-get update && apt-get install -y \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-xetex \
    texlive-latex-recommended \
    && rm -rf /var/lib/apt/lists/*

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