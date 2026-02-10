FROM node:18-slim
WORKDIR /app
COPY auth/package*.json ./
RUN npm install
COPY auth/ ./
COPY helpers ./helpers
EXPOSE 8003
CMD ["node","index.js"]
