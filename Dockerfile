FROM node:20.10.0-alpine as base

WORKDIR /app

COPY yarn.lock ./yarn.lock
COPY .yarnrc.yml ./.yarnrc.yml
COPY .yarn ./.yarn/
COPY package.json .
COPY tsconfig.json .


FROM base as ts-compile

COPY packages/main ./packages/main
RUN yarn workspaces focus @academy-be/main
RUN yarn workspace @academy-be/main build


FROM base as be-builder

WORKDIR /app

COPY /packages/main/package.json ./packages/main/package.json

RUN yarn workspaces focus @academy-be/main --production


FROM node:20.10.0-alpine

WORKDIR /app

COPY --from=be-builder /app/node_modules ./node_modules
COPY --from=be-builder /app/packages/main/package.json ./packages/main/package.json

COPY --from=ts-compile /app/packages/main/build/ ./packages/main/build/

COPY packages/main/env.local.yml ./packages/main/env.local.yml

EXPOSE 8080
CMD cd packages/main && yarn start:no-build