import chrome from './chrome.js';
const POST = {
	reload(request, response, args, query) { }
};

const GET = {
	reload(request, response, args, query) { }
};

const routers = {
	POST,
	GET
};

const regxpPath = [
	{
		reg: /^\/png\/([\w\-=/]+)\.png$/,
		handler: chrome.pagePng.bind(chrome)
	},
	{
		reg: /^\/jpg\/([\w\-=/]+)\.jpg$/,
		handler: chrome.pageJpg.bind(chrome)
	},
	{
		reg: /^\/pdf\/([\w\-=/]+)\.pdf$/,
		handler: chrome.pagePdf.bind(chrome)
	},
];

const regxpPostPath = [
	{
		reg: /^\/(png|jpg|pdf)\/screenshot\/?$/,
		handler: chrome.screenshotPage.bind(chrome)
	},
	{
		reg:/^\/page\/evaluate$/,
		handler:chrome.evaluate.bind(chrome)
	}
]

const regRouters = {
	GET: regxpPath,
	POST: regxpPostPath,
};

export default {
	getRouter(m) {
		if (routers[m]) {
			return routers[m];
		}
	},
	getRegxpRouter(m, pathinfo) {
		let routers;
		if (regRouters[m]) {
			routers = regRouters[m];
		}
		if (!routers) {
			return;
		}
		for (let i = 0, j = routers.length; i < j; i++) {
			const item = routers[i];
			if (item.reg.test(pathinfo)) {
				return {
					...item,
					matches: pathinfo.match(item.reg)
				};
			}
		}
	}
};
