FROM node:20-alpine
WORKDIR /app

# Install only production deps
COPY server/package*.json ./
RUN npm install --omit=dev

# Copy source and pre-built static UI
COPY server/src/   ./src/
COPY server/public/ ./public/

# Raise open-file limit for high-concurrency load testing
RUN echo "fs.file-max = 65536" >> /etc/sysctl.conf || true

EXPOSE 3001
ENV NODE_ENV=production

CMD ["node", "src/index.js"]
