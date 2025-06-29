FROM node:lts-alpine3.22

WORKDIR /app

COPY package*.json ./

RUN npm install -g npm@latest && npm install

# COPY .env.production .env

COPY prisma ./prisma

RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 4444

CMD [ "sh", "-c", "node dist/src/server.js" ]