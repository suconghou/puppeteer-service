import http from 'http';
import querystring from 'querystring';
import fs from 'fs';
import path from 'path';
import process from 'process';
import route from './route.js';
import sendFile from './sendfile.js';
import utiljs from './utiljs.js';
import utilnode from './utilnode.js';

const index = 'index.html';
const defaultPort = 9090;

export default class httpserver {
	constructor(args) {
		const params = utiljs.getParams(args);
		this.root = params.root || process.cwd();
		this.port = params.port || defaultPort;
		if (!(this.port > 1 && this.port < 65535)) {
			console.error('port %s error,should be 1-65535', this.port);
			process.exit(1);
		}
		this.server = http.createServer((request, response) => {
			try {
				const router = route.getRouter(request.method);
				if (!router) {
					return this.err404(response);
				}
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
				}
				// 优先级2 预处理文件 , 优先级3 静态文件
				const regRouter = route.getRegxpRouter(request.method, pathinfo);
				if (regRouter) {
					return regRouter
						.handler(request, response, regRouter.matches, query, this.root)
						.then(res => {
							if (res === false) {
								this.tryfile(response, pathinfo);
							}
						})
						.catch(e => {
							const err = e.toString();
							console.error(e);
							this.err500(response, err);
						});
				}
				return this.tryfile(response, pathinfo);

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
			if (!response.headersSent) {
				sendFile(response, stat, file);
			}
		});
	}
	err404(response) {
		if (!response.headersSent) {
			response.writeHead(404, { 'Content-Type': 'text/plain' });
		}
		if (!response.finished) {
			response.end('Not Found\n');
		}
	}

	err500(response, err) {
		if (!response.headersSent) {
			response.writeHead(500, { 'Content-Type': 'text/plain' });
		}
		if (!response.finished) {
			response.end(err + '\n');
		}
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
