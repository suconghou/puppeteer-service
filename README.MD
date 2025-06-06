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

http body 里发送要渲染的html

query 参数, 与下列说明相同

建议流程为:

前端请求 -> 后端查找缓存 -> 有缓存直接返回,无缓存进行渲染 -> 

后端render template as string -> http post template string to `/pdf/screenshot` -> 保存pdf,并缓存 

-> 返回给前端




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

> pdf 生成,不支持选择器,必须是整个网页


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

> query CSS选择器的base64值 , 默认截屏整个html, 传入选择器只截图指定区域

**jpg**

> wait,可选值 domcontentloaded,load,networkidle2,networkidle0 默认值 load
>
> w 宽度,像素单位,必须为整数,默认 1280,最大不超过 5000
>
> h 高度,像素单位,必须为整数,默认 800,最大不超过 5000
>
> fullPage 是否全屏,接受 0 或者 1,为1即为长截屏,高度为网页高度

> query CSS选择器的base64值 , 默认截屏整个html, 传入选择器只截图指定区域


## 代码执行接口

POST `/page/evaluate`

```json
{
    "url": "https://some-url",
    "intercept": [
        "image",
        "font",
        "stylesheet"
    ],
    "capture": "lapi/live/getH5Play",
    "script":""
}
```

大致有两种模式,`capture`和`script`字段至少其一

当capture有效时,为capture模式,会导航到指定url,抓取匹配的请求

当`script`有效时,如果url有效,则导航到url,然后执行script.否则,空白页面下执行script

`intercept`可配置拦截的资源,以提升页面加载速度

```json
{
	"script":"function(){return {\"agent\":navigator.userAgent}; }"
}
```
http 返回body： 
```json
{
  "agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/86.0.4240.111 Safari/537.36"
}
```


```json
{
	"script":"function(){return (new Date(1621420182781)).getHours() }"
}
```
http 返回body： 18


## 其他说明


已实现

Chrome实例缓存池

> 系统运行模式为一个Chrome实例 + 多个标签页

标签页缓存池

> 开启的标签页,会缓存留作下次加载页面,最多标签页为最大并发度



-   每次开启的 browser 和 page 均会无活动时自动回收 
-   图片和 pdf 响应带有 1 小时 http 缓存,有时你可能需要强制刷新

**最大并发度限制**



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
docker run --name ssr -d --restart always -e=TZ=CST-8 --log-opt max-size=1m -p 127.0.0.1:9090:9090 -m 800m suconghou/puppeteer:service
```


```
echo '#!/usr/bin/env node' | cat - bundle.js > ssr && chmod +x ssr
```

环境变量

headless
executablePath


本地测试 

export headless=0 executablePath='/tmp/chrome-mac/Chromium.app/Contents/MacOS/Chromium' && ./ssr


Chromium下载地址

https://download-chromium.appspot.com/
