import utilnode from './utilnode.js';
import utiljs, { waitUntil } from './utiljs.js';

const maxWidth = 5000;
const launchOps = {
	headless: true,
	args: ['–disable-gpu', '–no-first-run', '–no-zygote', '–single-process', '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
	ignoreHTTPSErrors: true,
	executablePath: '/usr/bin/chromium-browser'
};

const waits = ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'];

const browsers = {
	using: 0,
	maxusing: 200,
	timer: 0,
	maxIdleTime: 120e3
};

export default {
	async launch() {
		if (browsers.chrome) {
			browsers.using++;
			const c = browsers.chrome
			clearTimeout(c.timer)
			c.timer = setTimeout(async () => {
				try {
					await c.close()
				} catch (e) { }
			}, browsers.maxIdleTime)
			if (browsers.using < browsers.maxusing) {
				return browsers.chrome;
			}

			// 达到最大使用次数时,可能还有若干个标签在进行,我们需要等他们完成后在销毁
			setTimeout(async () => {
				try {
					await c.close()
				} catch (e) { }
			}, 15000)
		}
		if (browsers.creating) {
			return this.waitfor();
		}
		browsers.creating = true
		const puppeteer = require('puppeteer-core');
		const browser = await puppeteer.launch(launchOps);
		browser.on('disconnected', () => {
			browsers.chrome = null;
			browsers.using = 0;
		});
		browsers.chrome = browser;
		browsers.using = 0
		browsers.creating = false
		browser.timer = setTimeout(() => {
			if (!browser.timer.isclosed) {
				browser.timer.isclosed = true
				browser.timer.close()
			}
		}, browsers.maxIdleTime)
		return browser;
	},

	async waitfor() {
		return waitUntil(() => {
			if (browsers.chrome && browsers.using < browsers.maxusing) {
				return true
			}
		}, () => {
			return browsers.chrome
		}, err => {
			return null
		}, 100, 50)
	},

	async run(task) {
		const browser = await this.launch();
		const openPages = await browser.pages();
		let page;
		for (let item of openPages) {
			if (!item.running) {
				page = item
				page.running = true
				break;
			}
		}
		if (!page) {
			page = await browser.newPage();
			page.running = true
		}
		if (!page.using) {
			page.using = 1
		} else {
			page.using++
		}
		await task(page)
		if (page.using > 10) {
			await page.close()
		} else {
			await page.goto('about:blank')
		}
		page.running = false
		return true
	},

	pagePng(request, response, matches, query, cwd) {
		const u = utilnode.base64Decode(matches[1]);
		if (!utiljs.isUrl(u)) {
			return Promise.resolve(false);
		}

		const { viewPort, imgOps, gotoOps, selector } = this.opts(query)

		return this.run(async (page) => {
			await page.setViewport(viewPort);
			await page.goto(u, gotoOps);
			let div = page;
			if (selector) {
				div = await page.$(selector);
			}
			const img = await div.screenshot(imgOps);
			const headers = { 'Content-Type': 'image/png', 'Cache-Control': 'public,max-age=3600' };
			if (query.name) {
				headers['Content-Disposition'] = `attachment; filename* = UTF-8''${encodeURIComponent(query.name)}`;
			}
			response.writeHead(200, headers);
			response.end(img);
		})
	},
	pageJpg(request, response, matches, query, cwd) {
		const u = utilnode.base64Decode(matches[1]);
		if (!utiljs.isUrl(u)) {
			return Promise.resolve(false);
		}
		const { viewPort, imgOps, gotoOps, selector } = this.opts(query)

		return this.run(async (page) => {
			await page.setViewport(viewPort);
			await page.goto(u, gotoOps);
			let div = page;
			if (selector) {
				div = await page.$(selector);
			}
			const img = await div.screenshot(imgOps);
			const headers = { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public,max-age=3600' };
			if (query.name) {
				headers['Content-Disposition'] = `attachment; filename* = UTF-8''${encodeURIComponent(query.name)}`;
			}
			response.writeHead(200, headers);
			response.end(img);
		});

	},
	pagePdf(request, response, matches, query, cwd) {
		const u = utilnode.base64Decode(matches[1]);
		if (!utiljs.isUrl(u)) {
			return Promise.resolve(false);
		}
		const { pdfOps, gotoOps, } = this.opts(query)

		return this.run(async (page) => {
			await page.goto(u, gotoOps);
			const pdf = await page.pdf(pdfOps);
			const headers = { 'Content-Type': 'application/pdf', 'Cache-Control': 'public,max-age=3600' };
			if (query.name) {
				headers['Content-Disposition'] = `attachment; filename* = UTF-8''${encodeURIComponent(query.name)}`;
			}
			response.writeHead(200, headers);
			response.end(pdf);
		})
	},
	async screenshotPage(request, response, matches, query, cwd) {
		var t = matches[1]
		const { viewPort, imgOps, pdfOps, gotoOps } = this.opts(query)
		const body = await utilnode.body(request)
		const html = body.toString()
		return this.run(async (page) => {
			await page.setContent(html, gotoOps)
			const headers = { 'Cache-Control': 'public,max-age=3600' };
			let data;
			if (t == "png" || t == 'jpg') {
				await page.setViewport(viewPort);
				data = await page.screenshot(imgOps);
				headers['Content-Type'] = `image/${t}`;
			} else {
				data = await page.pdf(pdfOps);
				headers['Content-Type'] = 'application/pdf';
			}
			response.writeHead(200, headers);
			response.end(data);
		})
	},
	async evaluate(request, response, matches, query, cwd) {
		const body = await utilnode.body(request)
		const v = JSON.parse(body.toString())
		if (!v) {
			throw new Error("invalid params")
		}
		const s = v.script ? v.script.trim() : '';
		if (!s && !v.capture) {
			throw new Error("invalid script")
		}
		const { gotoOps } = this.opts(query)

		const inter = Array.isArray(v.intercept) && v.intercept.length && v.url;
		return this.run(async (page) => {
			const intered = v.intercept
			const fn = (request) => {
				if (intered.includes(request.resourceType())) {
					request.respond({
						status: 200,
						body: ''
					})
				} else {
					request.continue();
				}
			}
			try {
				if (inter) {
					await page.setRequestInterception(true);
					page.on('request', fn);
				}
				if (utiljs.isUrl(v.url)) {
					if (v.capture) {
						const timeout = 5e3;
						page.goto(v.url, gotoOps)
						const res = await page.waitForResponse(response => response.url().indexOf(v.capture) > -1, { timeout });
						const buf = await res.text()
						const headers = res.headers();
						response.writeHead(res.status(), { 'Content-Type': headers['content-type'] });
						return response.end(buf);
					} else {
						await page.goto(v.url, gotoOps);
					}
				}
				const f = `(${s})()`
				const res = await page.evaluate(f)
				response.writeHead(200, { 'Content-Type': 'application/json', });
				response.end(JSON.stringify(res));
			} catch (e) {
				response.writeHead(500, {});
				response.end(e.message);
			} finally {
				if (inter) {
					await page.setRequestInterception(false);
					page.removeListener('request', fn)
				}
			}
		})
	},
	opts(query) {
		const viewPort = {
			width: 1280,
			height: 800
		};
		const imgOps = {};
		const { w, h } = query;
		const wInt = parseInt(w);
		const hInt = parseInt(h);
		if (wInt && wInt < maxWidth) {
			viewPort.width = wInt;
		}
		if (hInt && hInt < maxWidth) {
			viewPort.height = hInt;
		}
		if (query.fullPage) {
			imgOps.fullPage = true;
		}
		const gotoOps = { timeout: 10e3 };
		if (waits.includes(query.wait)) {
			gotoOps.waitUntil = query.wait;
		}

		const pdfOps = {
			printBackground: true
		};
		if (['Letter', 'Legal', 'Tabloid', 'Ledger', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6'].includes(query.format)) {
			pdfOps.format = query.format;
		} else if (w || h) {
			if (w) {
				pdfOps.width = viewPort.width;
			}
			if (h) {
				pdfOps.height = viewPort.height
			}
		} else {
			pdfOps.format = 'A4';
		}
		if (/^\d+,\d+$/.test(query.margin)) {
			const [top, right] = query.margin.split(',');
			pdfOps.margin = {
				top: parseInt(top),
				right: parseInt(right),
				bottom: parseInt(top),
				left: parseInt(right)
			};
		} else if (/^\d+,\d+,\d+,\d+$/.test(query.margin)) {
			const [top, right, bottom, left] = query.margin.split(',');
			pdfOps.margin = { top: parseInt(top), right: parseInt(right), bottom: parseInt(bottom), left: parseInt(left) };
		}

		let selector;
		if (query.query) {
			selector = utilnode.base64Decode(query.query)
		}
		return {
			viewPort,
			gotoOps,
			imgOps,
			pdfOps,
			selector,
		}
	}
};
