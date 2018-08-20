## puppeteer as a service

## 基本 API

`/pdf/url的base64.pdf`

`/png/url的base64.png`

`/jpg/url的base64.jpg`

如: `http://127.0.0.1:9090/pdf/aHR0cHM6Ly93d3cub3NjaGluYS5uZXQ=.pdf?format=A3`

### 参数

**pdf**

> wait,可选值 domcontentloaded,load,networkidle2,networkidle0 默认值 load
>
> format 可选值 A0,A1,A2,A3,A4,A5,A6 默认值 A4
>
> w 宽度,像素单位,必须为整数, format 和 w 只能设置一个,format 优先级较高
>
> name 如果设置了 name,将会弹出下载
>
> margin 边距空白,整数,上右下左,以`,`号隔开,例: margin=10,20,0,20

**png**

> wait,可选值 domcontentloaded,load,networkidle2,networkidle0 默认值 load
>
> w 宽度,像素单位,必须为整数,默认 1280,最大不超过 5000
>
> h 高度,像素单位,必须为整数,默认 800,最大不超过 5000
>
> fullPage 是否全屏,接受 0 或者 1

**jpg**

> wait,可选值 domcontentloaded,load,networkidle2,networkidle0 默认值 load
>
> w 宽度,像素单位,必须为整数,默认 1280,最大不超过 5000
>
> h 高度,像素单位,必须为整数,默认 800,最大不超过 5000
>
> fullPage 是否全屏,接受 0 或者 1

## 其他说明

-   每次开启的 browsers 实例在 2 分钟内没有被再次使用,将被回收
-   每个 browsers 实例在使用 100 次后将自动销毁,然后产生新的
-   图片和 pdf 响应带有 1 小时 http 缓存,有时你可能需要强制刷新

## RUN IN DOCKER

*僵尸进程*

使用`dumb-init`防止僵尸进程

见 https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker


https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#running-on-alpine

```bash
docker run --name ssr -d \
-p 9090:9090 \
--restart always \
-m 512m \
--memory-swap=512m \
--shm-size=512m \
suconghou/puppeteer:service
```

## 关于中文支持

默认安装的`Chromium` 不支持中文

https://www.google.com/get/noto/help/cjk/

https://github.com/googlei18n/noto-cjk


支持英文,日文,简体中文

支持 emoji

若要添加更多支持,可以自定义.


```
echo '#!/usr/bin/env node' | cat - bundle.js > ssr && chmod +x ssr
```
