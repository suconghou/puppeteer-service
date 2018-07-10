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
