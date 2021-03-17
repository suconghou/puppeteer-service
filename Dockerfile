FROM suconghou/puppeteer:cn
LABEL maintainer="suconghou@gmail.com"
RUN wget -O /usr/local/bin/dumb-init https://download.fastgit.org/Yelp/dumb-init/releases/download/v1.2.5/dumb-init_1.2.5_x86_64 && \
    chmod +x /usr/local/bin/dumb-init && \
    mkdir /app/ && \
    cd /app/ && \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1 yarn add puppeteer-core --production --no-lockfile --ignore-optional --non-interactive && \
    yarn cache clean
WORKDIR /app
ADD ssr /app/
CMD ["dumb-init","/app/ssr"]
EXPOSE 9090

