# Builder

FROM node:6 as builder

WORKDIR /usr/src/app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .
RUN rm -rf ./public/monaco-editor
RUN cp -R ./node_modules/monaco-editor ./public/monaco-editor
RUN yarn build
RUN rm ./build/static/(js|css)/*.map


# Runner

FROM nginx
COPY --from=builder /usr/src/app/build /usr/share/nginx/html
