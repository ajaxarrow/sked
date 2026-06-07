FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build && cp sked.db .output/server/sked.db

ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
