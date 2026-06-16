FROM node:22-slim

# Install dependencies needed by Chrome for Testing
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libatspi2.0-0 \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Download Chrome for Testing 121 (matches Puppeteer 21.x)
RUN mkdir -p /opt/chrome-for-testing \
    && wget -q "https://storage.googleapis.com/chrome-for-testing-public/121.0.6167.85/linux64/chrome-linux64.zip" -O /tmp/chrome.zip \
    && unzip -q /tmp/chrome.zip -d /opt/chrome-for-testing \
    && rm /tmp/chrome.zip \
    && chmod +x /opt/chrome-for-testing/chrome-linux64/chrome

# Set Chrome path
ENV GOOGLE_CHROME_EXECUTABLE_PATH=/opt/chrome-for-testing/chrome-linux64/chrome
ENV PUPPETEER_EXECUTABLE_PATH=/opt/chrome-for-testing/chrome-linux64/chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NODE_OPTIONS=--max-old-space-size=4096

WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./
RUN npm install --production

# Copy source code and data
COPY . .

CMD ["npm", "start"]
