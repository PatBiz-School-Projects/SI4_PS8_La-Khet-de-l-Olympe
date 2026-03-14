FROM node:18-slim

WORKDIR /app

COPY userService/package*.json ./
RUN npm install --omit=dev

COPY userService/ ./
COPY auth/mongo.js ./

USER node

EXPOSE 8004

CMD ["node", "index.js"]
