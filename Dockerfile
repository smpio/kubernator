# Builder

FROM node:6 as builder

WORKDIR /usr/src/app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .
RUN yarn build
RUN rm ./build/static/**/*.map


# Runner

FROM nginx
COPY --from=builder /usr/src/app/build /usr/share/nginx/html
