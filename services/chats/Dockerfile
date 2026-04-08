FROM node:20-slim
WORKDIR /app
COPY chats/package*.json ./
RUN npm install
COPY chats/ ./
COPY helpers ./helpers
EXPOSE 8006
CMD ["node","index.js"]
