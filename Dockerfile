FROM suconghou/node:yarn
LABEL maintainer="suconghou@gmail.com"
ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_amd64 /usr/local/bin/dumb-init
RUN mkdir -p /src/ && apk update && apk upgrade && \
apk add --no-cache chromium && \
chmod +x /usr/local/bin/dumb-init
WORKDIR /src
ADD ssr /src/
RUN PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1 yarn add puppeteer && yarn cache clean
CMD ["dumb-init","/src/ssr"]
EXPOSE 9090


