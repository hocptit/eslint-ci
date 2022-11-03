FROM node:16-alpine AS builder
WORKDIR /app
COPY ["package.json", "./"]
RUN yarn
RUN #cat ./node_modules/.bin/eslint
ENTRYPOINT ["./node_modules/.bin/eslint"]
