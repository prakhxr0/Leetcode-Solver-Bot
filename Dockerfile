FROM node:22-slim

# Install Chromium + X11 dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Set Chrome path
ENV GOOGLE_CHROME_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Copy problems archive (baked into image)
COPY data/problems /app/data/problems

CMD ["npm", "start"]
