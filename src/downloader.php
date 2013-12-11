<?php

/**
*@package downloader
*@author suconghou 
*@version V1.0 build131208
*@link http://blog.suconghou.cn
*@copyright 2013 Suconghou All Right Reserved.
*php 实时下载类,能够下载大文件,进度实时显示,下载进度存储于$_SESSION['s']
*下载进度 size 包含文件的总大小 completed 包含已下载的大小 percent 包含完成的百分比
*/

class downloader
{
	/**
	*@param string url 要下载的目标文件地址
	*@param string filename 存储为的文件名称,程序会根据地址自动检测,不需要设置
	*@param strng save_folder  存储下载文件的目录,可修改,当不存在时会自动创建,但要有写权限
	*
	*
	*/
	private $url=null;
	private $filename=null;
	public $save_folder='save/';//保存目录,以 '/' 结尾

	function __construct($url)
	{
		ignore_user_abort(true);
		set_time_limit(60);

		$this-> url=$url;
		
	}
	function __destruct()
	{
		unset($_SESSION['s']);
	}


	function getsize()
	{

		$url = parse_url($this-> url);
		if ($fp = @fsockopen($url['host'],empty($url['port'])?80:$url['port'],$error))
		{
			fputs($fp,"GET ".(empty($url['path'])?'/':$url['path'])." HTTP/1.1\r\n");
            fputs($fp,"Host:$url[host]\r\n\r\n");
            while(!feof($fp))
            { 
                    $tmp = fgets($fp); 
                    if(trim($tmp) == '')
                    { 
                        break; 
                    }
                    else if(preg_match('/Content-Length:(.*)/si',$tmp,$arr))
                    { 
                        $size=trim($arr[1]); 
                        return $size;
                    } 
            }
			
		}
		else
		{
			exit('不支持fsockopen或地址失效:'.$error);
		}
	}

	function geturlsize()
	{
		$url=$this-> url;
		$fCont = file_get_contents($url);  
		return strlen($fCont); 

	}

	function url_exists()    
	{   
		$url=$this-> url;
    	return file_get_contents($url,0,null,0,1) ? true : false;   
	}

	//------字节格式化--------------------------
	function byte_format($size,$dec=2)
	{
		    $a = array("B","KB","MB","GB","TB","PB","EB","ZB","YB");
		    $pos = 0;
		    while ($size >= 1024)   
		    {
		        $size /= 1024;
		        $pos++;
		    }
		    return round($size,$dec)." ".$a[$pos];
	}

	function check_dir()
	{
		is_dir($this-> save_folder)||mkdir($this-> save_folder);
		$this-> filename=$this-> save_folder . basename($this-> url);//保存的文件名
		return(is_writable($this-> save_folder));

	}
	function down()
	{

		$filesize=$this->getsize();
		if($filesize<1)
		{
			$filesize=$this->geturlsize();
		}
		
		
		$urlfile = fopen ($this-> url, "rb");//获取远程文件
		$file = fopen ($this-> filename, "wb");//写入文件
		if ($file)
		{
			while (!feof($urlfile))
			{
				 $data=fread($urlfile, 1024 * 8 );//默认获取8K
				 $length+=strlen($data);//累计已经下载的字节数
				 fwrite($file, $data, 1024 * 8 );

				$persent=round(($length/$filesize)*100,2);
		
				$persent.='%';
				$info=array('size'=>$this->byte_format($filesize),
				 			 'completed'=>$this->byte_format($length),
				 			 'percent'=>$persent
				 			 );
				session_start();
				$_SESSION['s']=$info;
				session_write_close();
			}


			
		}


	}

	function start()
	{
		if ($this->url_exists())
		{
			if ($this->check_dir())
			{
				$this->down();
			}
			else
			{
				session_start();
				$_SESSION['s']=array('msg'=>'存储的目录不可写!');
				session_write_close();
				exit();

			}
			
		}
		else
		{
			session_start();
			$_SESSION['s']=array('msg'=>'输入的资源地址不正确!');
			session_write_close();
			exit();
		}
	}

}


//  usage


if ($_GET['url'])
{	
	
	$down=new downloader($_GET['url']);
	$down->start();
}

