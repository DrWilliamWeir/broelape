FROM node:14-alpine3.16

WORKDIR /docker

COPY  . /docker 

COPY /server /docker/server

COPY /public /docker/public

RUN npm install

CMD ["npm", "start"]


