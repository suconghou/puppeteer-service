import utilnode from './utilnode.js';
import utiljs, { sleep } from './utiljs.js';

const maxWidth = 5000;
const maxPages = 5;

const launchOps = {
	headless: (typeof process.env.headless !== 'undefined') ? Boolean(Number(process.env.headless)) : true,
	args: ['--disable-gpu', '--no-first-run', '--no-zygote', '--no-startup-widnow', '--single-process', '--no-sandbox', '--disable-crash-reporter', '--disable-breakpad', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
	ignoreHTTPSErrors: true,
	executablePath: process.env.executablePath ? process.env.executablePath : '/usr/bin/chromium-browser'
};

const waits = ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'];

const timeout = async (t) => {
	await sleep(t)
	throw new Error("timeout")
}

class browsers {


	constructor() {
		this.browsers = []
		this.loop()
	}


	loop() {
		setTimeout(() => this.loop(), 15e3)
		this.cleanup();
	}

	async cleanup() {
		const t = +new Date()
		for (let item of this.browsers) {
			const openPages = await item.pages();
			if (openPages.length == 0 && t - item.time > 30e3) {
				await item.close()
				return
			}
			for (let page of openPages) {
				if (page.running) {
					return
				}
			}
			for (let page of openPages) {
				if (t - page.time > 30e3) {
					await page.close()
					return
				}
			}
		}
	}

	async launch() {
		for (let item of this.browsers) {
			return item
		}
		const puppeteer = require('puppeteer-core');
		const browser = await puppeteer.launch(launchOps);
		const t = +new Date()
		browser.time = t
		this.browsers.push(browser)
		browser.on('disconnected', () => {
			this.browsers = this.browsers.filter(item => {
				return item && item.isConnected() && item.time !== t;
			})
		});
		return browser
	}

	async getPage() {
		const browser = await this.launch()
		const openPages = await browser.pages();
		for (let item of openPages) {
			if (!item.running) {
				return item
			}
		}
		const num = openPages.length
		if (num < maxPages) {
			// 因newPage调用是异步,最大限制仅为参考值,并发情况下可突破
			return await browser.newPage();
		}
		let i = 0;
		while (i++ < 50) {
			await sleep(200);
			for (let item of openPages) {
				if (!item.running) {
					return item
				}
			}
		}
		throw new Error("getPage timeout")
	}


	/**
	 * 拿到一个Page实例执行
	 * @param {function} task 
	 */
	async run(task) {
		const page = await this.getPage()
		page.running = true
		page.time = +new Date()
		let err, res
		try {
			res = await Promise.race([task(page), timeout(15e3)])
		} catch (e) {
			err = e
			throw e
		} finally {
			await page.goto('about:blank')
			page.running = false
			if (!err) {
				return res
			}
		}
	}

}


const chrome = new browsers()



export default {

	run(task) {
		return chrome.run(task)
	},

	async pagePng(request, response, matches, query, cwd) {
		const u = this.getURL(matches[1])
		const { viewPort, imgOps, gotoOps, selector } = this.opts(query)

		return await this.run(async (page) => {
			await page.setViewport(viewPort);
			await page.goto(u, gotoOps);
			if (response.headersSent || response.finished) {
				return
			}
			let div = page;
			if (selector) {
				div = await page.$(selector);
			}
			const img = await div.screenshot(imgOps);
			if (response.headersSent || response.finished) {
				return
			}
			const headers = { 'Content-Type': 'image/png', 'Cache-Control': 'public,max-age=3600' };
			if (query.name) {
				headers['Content-Disposition'] = `attachment; filename* = UTF-8''${encodeURIComponent(query.name)}`;
			}
			response.writeHead(200, headers);
			response.end(img);
		})
	},
	async pageJpg(request, response, matches, query, cwd) {
		const u = this.getURL(matches[1])
		const { viewPort, imgOps, gotoOps, selector } = this.opts(query)

		return await this.run(async (page) => {
			await page.setViewport(viewPort);
			await page.goto(u, gotoOps);
			if (response.headersSent || response.finished) {
				return
			}
			let div = page;
			if (selector) {
				div = await page.$(selector);
			}
			const img = await div.screenshot(imgOps);
			if (response.headersSent || response.finished) {
				return
			}
			const headers = { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public,max-age=3600' };
			if (query.name) {
				headers['Content-Disposition'] = `attachment; filename* = UTF-8''${encodeURIComponent(query.name)}`;
			}
			response.writeHead(200, headers);
			response.end(img);
		});

	},
	async pagePdf(request, response, matches, query, cwd) {
		const u = this.getURL(matches[1])
		const { pdfOps, gotoOps, } = this.opts(query)

		return await this.run(async (page) => {
			await page.goto(u, gotoOps);
			if (response.headersSent || response.finished) {
				return
			}
			const pdf = await page.pdf(pdfOps);
			if (response.headersSent || response.finished) {
				return
			}
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
		return await this.run(async (page) => {
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
			if (query.name) {
				headers['Content-Disposition'] = `attachment; filename* = UTF-8''${encodeURIComponent(query.name)}`;
			}
			if (response.headersSent || response.finished) {
				return
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
		return await this.run(async (page) => {
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
						await page.goto(v.url, gotoOps)
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
	getURL(encoded) {
		const u = utilnode.base64Decode(encoded);
		if (!utiljs.isUrl(u)) {
			throw new Error("invalid url");
		}
		return u
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
