FROM node:20-slim

WORKDIR /app

COPY challengeService/package*.json ./
RUN npm install --omit=dev

COPY challengeService/ ./
COPY helpers ./helpers

USER node

EXPOSE 8005

CMD ["node", "index.js"]
