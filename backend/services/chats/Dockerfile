FROM node:20-slim

WORKDIR /app

COPY ./package*.json ./
RUN npm install --omit=dev

COPY . .

USER node

EXPOSE 8006

CMD ["node", "index.js"]
