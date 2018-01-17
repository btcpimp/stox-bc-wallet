FROM node:8.9.1

COPY package.json /service/
COPY package-lock.json /service/

WORKDIR /service

RUN npm install

ADD . /service

ENTRYPOINT [ "npm", "run", "serve"]