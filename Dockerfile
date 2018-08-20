FROM suconghou/node:yarn
LABEL maintainer="suconghou@gmail.com"
ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_amd64 /usr/local/bin/dumb-init
RUN mkdir -p /src/ && apk update && apk upgrade && \
apk add --no-cache chromium && \
chmod +x /usr/local/bin/dumb-init
RUN cd /usr/share/fonts && \
wget https://noto-website-2.storage.googleapis.com/pkgs/NotoSerifSC.zip && unzip NotoSerifSC.zip && rm -rf NotoSerifSC.zip *.txt README && \
wget https://noto-website-2.storage.googleapis.com/pkgs/NotoSansSC.zip && unzip NotoSansSC.zip && rm -rf NotoSansSC.zip *.txt README && \
wget https://github.com/emojione/emojione-assets/releases/download/3.1.2/emojione-android.ttf
WORKDIR /src
ADD ssr /src/
RUN PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1 yarn add puppeteer && \
yarn cache clean
CMD ["dumb-init","/src/ssr"]
EXPOSE 9090


