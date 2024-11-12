FROM node:16-alpine
VOLUME ["/data"]
ENV REDIS_HOST="vpdiffredis"
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY ./package.json ./package-lock.json /usr/src/app/
RUN npm install
COPY . /usr/src/app
EXPOSE 10005 10004
CMD /usr/src/app/start.sh
