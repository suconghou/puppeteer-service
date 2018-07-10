FROM suconghou/node:yarn AS build

FROM suconghou/puppeteer
LABEL maintainer="suconghou@gmail.com"
RUN mkdir -p /opt/yarn/ /src/
COPY --from=build /usr/local/bin/node /usr/local/bin/node
COPY --from=build /opt/yarn /opt/yarn
RUN ln -s /opt/yarn/bin/yarn /usr/local/bin/yarn && ln -s /opt/yarn/bin/yarnpkg /usr/local/bin/yarnpkg
WORKDIR /src
ADD bundle.js /src/
RUN PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1 yarn add puppeteer && yarn cache clean
CMD ["node","bundle.js"]
EXPOSE 9090


