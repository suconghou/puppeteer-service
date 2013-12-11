<!DOCTYPE html>
<html>
<head>
	<title>带进度条实时下载</title>
	<link rel="stylesheet" type="text/css" href="http://cdnjs.bootcss.com/ajax/libs/twitter-bootstrap/3.0.0/css/bootstrap.min.css">
	<style type="text/css">

		#darkbg {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: -11;
		margin: 0;
		padding: 0;
		overflow: hidden;
		background: rgba(200,200,200,0.6);
		}
		input,textarea,button{outline: none;resize:none;}
		.main{margin-top: 80px;}
		#bar{display: none;}
	</style>
</head>
<body>
<div id='darkbg'></div>
<div class='container'>

<div class='row main'>
<div class='col-md-offset-2 col-md-8'>
<h1 align='center'>PHP带进度条下载实时显示</h1>


<div class='row' style='margin-top:40px'>
<div class='col-md-offset-2 col-md-8'>
<textarea class="form-control" rows="3" id='url' ></textarea>
</div>
</div>

<div class='row' style='margin-top:40px'>
<div class='col-md-offset-2 col-md-8'>
<p align='center'>
<button class='btn btn-primary' onclick='go()'>开始下载</button>  <button class='btn btn-danger'>清空输入</button>
</p>
</div>
</div>

<div class='row' style='margin-top:40px'>
<div class='col-md-offset-2 col-md-8'>
<div class="progress progress-striped active" id='bar'>
  <div class="progress-bar"  id="progressbar" style='width:0%'></div>
</div>
<p class='text-info' id='info'></p>
<p class='text-success' id='done'></p>
  </div>
</div>



</div>
</div>

</div>

<script type="text/javascript" src="http://code.jquery.com/jquery-1.10.2.min.js"></script>
<script type="text/javascript" src="http://cdnjs.bootcss.com/ajax/libs/jquery-backstretch/2.0.4/jquery.backstretch.min.js"></script>
<script type="text/javascript">


var images = ["http://w.qq.com/img/bg/8.jpg","http://w.qq.com/img/bg/20.jpg","http://w.qq.com/img/bg/7.jpg","http://w.qq.com/img/bg/9.jpg","http://w.qq.com/img/bg/18.jpg","http://w.qq.com/img/bg/7.jpg","http://w.qq.com/img/bg/0.jpg","http://w.qq.com/img/bg/22.jpg","http://w.qq.com/img/bg/14.jpg"];


	var index = 0;

	$.backstretch(images[index], {speed:800});
	setInterval(function() {
		index = (index >= images.length - 1) ? 0 : index + 1;
		$.backstretch(images[index]);
	}, 10000);




function go()
{
	$('#progressbar').css('width','0%');
	$.get('downloader.php?url='+$('#url').val(),function(data){
		s();
		$('#done').html('下载完成');
		clearInterval(timer);
	});

	$('#bar').fadeIn();
	$('#info').html('正在启动下载进程...');
	timer=setInterval(s,500);
	
}


function s()
{
	$.get('status.php?'+Math.random(),function(data){
		var obj=eval('('+data+')');
if (obj.msg!=undefined)
 {

	(obj.msg==null)||$('#info').html(obj.msg);


 }
 else
 {
 	$('#progressbar').css('width',obj.percent);
	$('#info').html('文件总大小:'+obj.size+',已下载:'+obj.completed+',进度:'+obj.percent);

	
 }

	});
}

</script>

</html>