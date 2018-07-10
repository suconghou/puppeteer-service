import http from 'http';
import querystring from 'querystring';
import fs from 'fs';
import path from 'path';
import route from './route.js';
import sendFile from './sendfile.js';
import utiljs from './utiljs.js';
import utilnode from './utilnode.js';

const index = 'index.html';

export default class httpserver {
	constructor(port, cwd) {
		this.port = port;
		this.root = cwd;
		this.server = http.createServer((request, response) => {
			try {
				const router = route.getRouter(request.method);
				if (router) {
					const [pathinfo, qs] = request.url.split('?');
					const query = querystring.parse(qs);
					const [fn, ...args] = pathinfo.split('/').filter(item => item);
					if (!fn) {
						return this.noIndex(request, response, pathinfo, query);
					}
					const m = router[fn];
					if (utiljs.isFunction(m)) {
						// 优先级1 预定义函数
						return m(request, response, args, query);
					} else {
						// 优先级2 预处理文件 , 优先级3 静态文件
						const regRouter = route.getRegxpRouter(request.method, pathinfo);
						if (regRouter) {
							return regRouter
								.handler(response, regRouter.matches, query, this.root)
								.then(res => {
									if (!res) {
										this.tryfile(response, pathinfo);
									}
								})
								.catch(e => {
									const err = e.toString();
									console.error(err);
									this.err500(response, err);
								});
						} else {
							return this.tryfile(response, pathinfo);
						}
					}
				}
				this.err404(response);
			} catch (e) {
				const err = e.toString();
				console.error(err);
				this.err500(response, err);
			}
		});
	}

	run() {
		this.server.listen(this.port).on('error', err => {
			console.info(err.toString());
		});
		console.log('Server running at http://127.0.0.1:%s', this.port);
	}
	tryfile(response, filePath) {
		const file = path.join(this.root, filePath);
		fs.stat(file, (err, stat) => {
			if (err) {
				return this.err404(response);
			}
			sendFile(response, stat, file);
		});
	}
	err404(response) {
		response.writeHead(404, { 'Content-Type': 'text/plain' });
		response.end('Not Found\n');
	}

	err500(response, err) {
		response.writeHead(500, { 'Content-Type': 'text/plain' });
		response.end(err + '\n');
	}
	noIndex(request, response, pathinfo, query) {
		const file = path.join(this.root, index);
		fs.stat(file, (err, stat) => {
			if (err) {
				const info = utilnode.getStatus();
				response.writeHead(200, { 'Content-Type': 'application/json' });
				return response.end(JSON.stringify(info));
			}
			sendFile(response, stat, file);
		});
	}
}
