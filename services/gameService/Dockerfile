FROM node:18-slim
WORKDIR /app
COPY gameService/package*.json ./
RUN npm install
COPY gameService/ ./
COPY helpers ./helpers
EXPOSE 8002
CMD ["node","index.js"]
