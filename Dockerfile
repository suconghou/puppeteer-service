FROM suconghou/puppeteer:cn
LABEL maintainer="suconghou@gmail.com"
RUN wget -O /usr/local/bin/dumb-init https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_amd64 && \
    chmod +x /usr/local/bin/dumb-init && \
    mkdir /app/ && \
    cd /app/ && \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1 yarn add puppeteer-core --no-lockfile --ignore-optional --non-interactive && \
    yarn cache clean
WORKDIR /app
ADD ssr /app/
CMD ["dumb-init","/app/ssr"]
EXPOSE 9090

