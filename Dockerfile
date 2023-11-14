FROM node:16.17.0-alpine as builder

WORKDIR /root/new/Backend

RUN npm install

RUN npx prisma migrate dev

RUN npm start