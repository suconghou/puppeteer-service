const regUrl = /^https?:\/\/[^\s]+$/;

export default {
	isFunction(value) {
		return typeof value === 'function';
	},
	isUrl(url) {
		return regUrl.test(url);
	},
	unique(arr) {
		return Array.from(new Set(arr));
	},
	getParams(args) {
		const kMap = {
			'-p': 'port',
			'-d': 'root',
			'--debug': 'debug'
		};
		const ret = {};
		const keys = Object.keys(kMap);
		let key;
		args.forEach(item => {
			if (keys.includes(item)) {
				if (item.substr(0, 2) == '--') {
					ret[kMap[item]] = true;
				} else {
					key = kMap[item];
				}
			} else if (key && item.toString().charAt(0) != '-') {
				ret[key] = item;
				key = null;
			} else {
				key = null;
			}
		});
		return ret;
	}
};


export const sleep = async ms => {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
};
// 新增特性:传入的参数可以是async函数
export const waitUntil = async (c, fun, fall = () => { }, dur = 50, maxTimes = 20) => {
	let times = 0;
	const funwarp = async () => {
		const ret = await c();
		times++;
		if (ret) {
			return await fun(ret, times);
		} else if (times < maxTimes) {
			await sleep(dur);
			return await funwarp();
		} else {
			return await fall(times);
		}
	};
	return await funwarp();
};


export const asyncTask = {
	len: 0,
	async run(f) {
		try {
			this.len++
			return await f();
		} finally {
			this.len--
		}
	},
	getLen() {
		return this.len
	}
}