import utilnode from './utilnode.js';
import utiljs from './utiljs.js';

const maxWidth = 5000;
const launchOps = {
	args: ['--no-sandbox', '--disable-setuid-sandbox'],
	ignoreHTTPSErrors: true,
	executablePath: '/chrome-linux/chrome'
	// executablePath: '/tmp/chrome-mac/Chromium.app/Contents/MacOS/Chromium'
};

const waits = ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'];

const browsers = {
	used: 0,
	maxUsed: 100,
	timer: 0,
	maxIdleTime: 120e3
};

export default {
	async launch() {
		clearTimeout(browsers.timer);
		browsers.timer = setTimeout(async () => {
			if (browsers.chrome) {
				await browsers.chrome.close();
			}
		}, browsers.maxIdleTime);
		if (browsers.chrome) {
			browsers.used++;
			if (browsers.used < browsers.maxUsed) {
				return browsers.chrome;
			}
			await browsers.chrome.close();
		}
		const puppeteer = require('puppeteer');
		const browser = await puppeteer.launch(launchOps);
		browser.on('disconnected', () => {
			browsers.chrome = null;
			browsers.used = 0;
		});
		browsers.chrome = browser;
		return browser;
	},

	pagePng(response, matches, query, cwd) {
		const u = utilnode.base64Decode(matches[1]);
		if (utiljs.isUrl(u)) {
			return new Promise((resolve, reject) => {
				(async () => {
					try {
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
						const browser = await this.launch();
						const page = await browser.newPage();
						try {
							await page.setViewport(viewPort);
							await page.goto(u, gotoOps);
							const img = await page.screenshot(imgOps);
							response.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public,max-age=3600' });
							response.end(img);
							await page.close();
							resolve(true);
						} catch (e) {
							await page.close();
							reject(e);
						}
					} catch (e) {
						reject(e);
					}
				})();
			});
		} else {
			return Promise.resolve(false);
		}
	},
	pageJpg(response, matches, query, cwd) {
		const u = utilnode.base64Decode(matches[1]);
		if (utiljs.isUrl(u)) {
			return new Promise((resolve, reject) => {
				(async () => {
					try {
						const viewPort = {
							width: 1280,
							height: 800
						};
						const imgOps = {
							type: 'jpeg',
							quality: 90
						};
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
						const browser = await this.launch();
						const page = await browser.newPage();
						try {
							await page.setViewport(viewPort);
							await page.goto(u, gotoOps);
							const img = await page.screenshot(imgOps);
							response.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public,max-age=3600' });
							response.end(img);
							await page.close();
							resolve(true);
						} catch (e) {
							await page.close();
							reject(e);
						}
					} catch (e) {
						reject(e);
					}
				})();
			});
		} else {
			return Promise.resolve(false);
		}
	},
	pagePdf(response, matches, query, cwd) {
		const u = utilnode.base64Decode(matches[1]);
		if (utiljs.isUrl(u)) {
			return new Promise((resolve, reject) => {
				(async () => {
					try {
						const pdfOps = {
							printBackground: true
						};
						const w = parseInt(query.w);
						if (['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6'].includes(query.format)) {
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
						const gotoOps = { timeout: 10e3 };
						if (waits.includes(query.wait)) {
							gotoOps.waitUntil = query.wait;
						}
						const browser = await this.launch();
						const page = await browser.newPage();
						try {
							await page.emulateMedia('screen');
							await page.goto(u, gotoOps);
							const pdf = await page.pdf(pdfOps);
							const headers = { 'Content-Type': 'application/pdf', 'Cache-Control': 'public,max-age=3600' };
							if (query.name) {
								headers['Content-Disposition'] = `attachment; filename=${encodeURIComponent(query.name)}`;
							}
							response.writeHead(200, headers);
							response.end(pdf);
							await page.close();
							resolve(true);
						} catch (e) {
							await page.close();
							reject(e);
						}
					} catch (e) {
						reject(e);
					}
				})();
			});
		} else {
			return Promise.resolve(false);
		}
	}
};
