## puppeteer as a service

## 基本 API


三个GET类型基本API

GET `/pdf/url的base64.pdf`

GET `/png/url的base64.png`

GET `/jpg/url的base64.jpg`

如: `http://127.0.0.1:9090/pdf/aHR0cHM6Ly93d3cub3NjaGluYS5uZXQ=.pdf?format=A3`


1类POST类型综合API

**高级截图**

POST `/pdf/screenshot` `/png/screenshot` `/jpg/screenshot`

参数
```json


```


### 参数



load：默认值， load 事件触发就算成功
domcontentloaded： domcontentloaded 事件触发就算成功
networkidle0：在 500ms 内没有网络连接时就算成功
networkidle2：在 500ms 内有不超过 2 个网络连接时就算成功



**pdf**

> wait,可选值 domcontentloaded,load,networkidle2,networkidle0 默认值 load
>
> format 可选值 见下表
>
> w 宽度,像素单位,必须为整数, format 和 w 只能设置一个,format 优先级较高
>
> name 如果设置了 name,将会弹出下载
>
> margin 边距空白,整数,上右下左,以`,`号隔开,例: margin=10,20,0,20


```
Letter: 8.5in x 11in
Legal: 8.5in x 14in
Tabloid: 11in x 17in
Ledger: 17in x 11in
A0: 33.1in x 46.8in
A1: 23.4in x 33.1in
A2: 16.54in x 23.4in
A3: 11.7in x 16.54in
A4: 8.27in x 11.7in
A5: 5.83in x 8.27in
A6: 4.13in x 5.83in
```

**png**

> wait,可选值 domcontentloaded,load,networkidle2,networkidle0 默认值 load
>
> w 宽度,像素单位,必须为整数,默认 1280,最大不超过 5000
>
> h 高度,像素单位,必须为整数,默认 800,最大不超过 5000
>
> fullPage 是否全屏,接受 0 或者 1,为1即为长截屏,高度为网页高度

**jpg**

> wait,可选值 domcontentloaded,load,networkidle2,networkidle0 默认值 load
>
> w 宽度,像素单位,必须为整数,默认 1280,最大不超过 5000
>
> h 高度,像素单位,必须为整数,默认 800,最大不超过 5000
>
> fullPage 是否全屏,接受 0 或者 1,为1即为长截屏,高度为网页高度

## 其他说明


已实现

Chrome实例缓存池

> 系统运行模式为一个Chrome实例 + 多个标签页

标签页缓存池

> 开启的标签页,会缓存留作下次加载页面,最多标签页为最大并发度



-   每次开启的 browsers 实例在 2 分钟内没有被再次使用,将被回收
-   每个 browsers 实例在使用 100 次后将自动销毁,然后产生新的
-   图片和 pdf 响应带有 1 小时 http 缓存,有时你可能需要强制刷新





## RUN IN DOCKER

*僵尸进程*

使用`dumb-init`防止僵尸进程

见 https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker


https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#running-on-alpine

```bash
docker run --name ssr \
--rm -it \
-p 9090:9090 \
-m 800m \
suconghou/puppeteer:service
```



```
echo '#!/usr/bin/env node' | cat - bundle.js > ssr && chmod +x ssr
```
