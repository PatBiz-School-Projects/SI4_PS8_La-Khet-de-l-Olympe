FROM node:20-slim

WORKDIR /app

COPY userService/package*.json ./
RUN npm install --omit=dev

COPY userService/ ./
COPY helpers ./helpers

USER node

EXPOSE 8004

CMD ["node", "index.js"]
