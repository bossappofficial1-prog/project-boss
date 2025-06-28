FROM node:lts-alpine3.22

WORKDIR /app

COPY package*.json ./

RUN npm install -g npm@latest && npm install

COPY .env.production .env

COPY prisma ./prisma

RUN npx prisma generate

COPY . .

RUN npm run build

RUN mkdir -p dist/src/templates && \
    cp src/templates/*.html dist/src/templates/

EXPOSE 2222

CMD [ "sh", "-c", "node dist/src/server.js" ]