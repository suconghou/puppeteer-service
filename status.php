<?php
//负责实时输出下载进度
session_start();

echo json_encode($_SESSION['s']);

session_write_close();