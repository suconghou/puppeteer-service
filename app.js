var path=require('path');
var url=require('url');
var fs=require('fs');
var http=require('http');
var exec=require('child_process').exec;
var less=require('less');


var config=
{
	port:8088,
	debug:true,
	staticPath:__dirname,
	watchPath:path.join(__dirname,'static','css')
};


var server=http.createServer(function(request,response)
{
	var pathname = url.parse(request.url).pathname;
	var realPath = path.join(config.staticPath, pathname);
	var ext = path.extname(realPath);
	ext = ext ? ext.slice(1) : 'unknown';
	console.log(pathname,realPath,ext);
	if(middleware[ext])
	{
		return middleware[ext](realPath,response);
	}
	return readfile(realPath,response,function(realPath,response)
	{
		response.write(realPath+"Not Found");
		response.end();
	});

}).listen(config.port);

console.log('Server is listen on '+config.port);
var fsTimeout;
fs.watch(config.watchPath,function(event,fname)
{
	if(fname&&!fsTimeout)
	{
		console.log(fname);
		fsTimeout=setTimeout(function(){ fsTimeout=null;},5000);
	}
});
var middleware=
{
	css:function(realPath,response)
	{
		return readfile(realPath,response,this.less);
	},
	less:function(realPath,response)
	{
		realPath=realPath.replace('.css','.less');
		console.log(realPath);
		fs.exists(realPath,function(exists)
		{
			if(exists)
			{
				fs.readFile(realPath,'utf-8',function(err,file)
				{
					if(err)
					{
						console.log(err);
						response.write(' load file '+realPath+' error');
						response.end();
					}
					else
					{
						var option={paths:path.dirname(realPath)};
						if(!config.debug)
						{
							option.compress=true;
							option.yuicompress=true;
							option.optimization=1;
						}
						less.render(file,option,function(err,data)
						{
							if(err)
							{
								console.log(err);
								response.write(err.message+" on line "+err.line+err.extract.join());
								response.end();
							}
							else
							{
								response.write(data.css);
								response.end();
							}
						});
					}

				})
			}
			else
			{
				response.write(' try find '+realPath+' Not Found');
				response.end();
			}
		});
	}
};


var readfile=function(realPath,response,callback)
{
	fs.exists(realPath,function(exists)
	{
		if(exists)
		{
			fs.readFile(realPath,'binary',function(err,file)
			{
				if(err)
				{
					callback(realPath,response);
				}
				else
				{
					response.write(file, 'binary');
					response.end();
				}
			});
		}
		else
		{
			callback(realPath,response);
		}

	});
};