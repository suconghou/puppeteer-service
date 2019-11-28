import utilnode from './utilnode.js';
import utiljs from './utiljs.js';
import marker from './marker.js'

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
	maxusing: 50,
	timer: 0,
	maxIdleTime: 20e3
};

export default {
	async launch() {
		clearTimeout(browsers.timer);
		browsers.timer = setTimeout(() => {
			if (browsers.chrome) {
				// 一段时间限制后,触发自动清理
				browsers.chrome.close();
				browsers.chrome = null
			}
		}, browsers.maxIdleTime);
		if (browsers.chrome) {
			browsers.using++;
			if (browsers.using < browsers.maxusing) {
				return browsers.chrome;
			}
			// 达到最大使用次数时,可能还有若干个标签在进行,我们需要等他们完成后在销毁
			await browsers.chrome.close()
		}
		const puppeteer = require('puppeteer-core');
		const browser = await puppeteer.launch(launchOps);
		browser.on('disconnected', () => {
			browsers.chrome = null;
			browsers.using = 0;
		});
		console.info("clear new")
		browsers.chrome = browser;
		return browser;
	},

	async run(task) {
		const browser = await this.launch();
		const openPages = await browser.pages();
		let page;
		console.info(openPages.length)
		for (let i in openPages) {
			const item = openPages[i]
			if (!item.running) {
				page = item
				page.running = true
				break;
			}
		}
		if (!page) {
			page = await browser.newPage();
			page.using = 0
			page.running = true
		}
		page.using++
		await task(page)
		if (page.using > 10) {
			await page.close()
			console.info("page closed")
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

		const { viewPort, imgOps, gotoOps } = this.opts(query)

		return this.run(async (page) => {
			await page.setViewport(viewPort);
			await page.goto(u, gotoOps);
			const img = await page.screenshot(imgOps);
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
		const { viewPort, imgOps, gotoOps } = this.opts(query)

		return this.run(async (page) => {
			await page.setViewport(viewPort);
			await page.goto(u, gotoOps);
			const img = await page.screenshot(imgOps);
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
		const { pdfOps, gotoOps } = this.opts(query)

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
		} else if (w) {
			pdfOps.width = w;
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

		return {
			viewPort,
			gotoOps,
			imgOps,
			pdfOps,
		}
	}
};
