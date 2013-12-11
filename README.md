
<html>
<head>
	<h1>PHP带进度条实时下载</h1>
</head>
<body>
<h2>文件说明</h2>
<ul>
<li>downloader.php 包含试试下载的类文件</li>
<li>status.php 用于输出实时下载状况的文件</li>
<li>index.php  前台界面文件,用ajax向status.php请求下载状态</li>

</ul>
<h2>如何使用</h2>
<ol>
<li>向downloader.php传递$_GET['url']参数,下载进程即开始</li>
<li>downloader检查下载连接是否可用等,判断是否开启下载</li>
<li>index.php中的ajax向status.php获取信息,会显示不能下载,或者下载的进度</li>
<li>ajax实时回调函数实时绘制下载进度条</li>
<li>当发起$_GET['url']的ajax执行回调函数时,下载即完成!或者由于set_time_limit所设定的超时时间到达.</li>
</ol>

<h2>如何配置</h2>
<ol>
<li>程序基本无需配置即可使用,但你也可以配置他,使其更好的工作.</li>
<li>在downloader.php设置save_folder文件要存放的文件夹,当这个文件夹不存在时,会自动新建,但是要有写权限</li>
<li>在构造函数中设置set_time_limit可以使超时时间延长使其下载更大文件</li>
<li>程序使用了fsockopen,如果你的服务器禁用了,你可以改为curl获取文件大小,这很简单.</li>
</ol>

<h2>联系</h2>
<ul>
<li>我的博客 <a href="http://blog.suconghou.cn">http://blog.suconghou.cn</a></li>
<li>邮箱 suconghou@126.com</li>
</ul>
</body>
</html>