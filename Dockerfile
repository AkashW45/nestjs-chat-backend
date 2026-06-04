# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY . .

# Build only if a "build" script exists in package.json; ignore failures
RUN if grep -q '"build"' package.json 2>/dev/null; then npm run build || true; fi

EXPOSE 3000

# Pick whichever entry point this repo actually has
CMD ["sh", "-c", "\
    if [ -f dist/main.js ]; then exec node dist/main.js; \
    elif [ -f dist/index.js ]; then exec node dist/index.js; \
    elif [ -f index.js ]; then exec node index.js; \
    else exec npm start; fi"]
