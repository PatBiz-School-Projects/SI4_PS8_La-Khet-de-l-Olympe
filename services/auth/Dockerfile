FROM node:20-slim
WORKDIR /app
COPY auth/package*.json ./
RUN npm install
COPY auth/ ./
COPY helpers ./helpers
EXPOSE 8003
CMD ["node","index.js"]
