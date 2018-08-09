#!/bin/bash
make release && \
docker build -t=suconghou/puppeteer:service .
