import process from 'process';
import { Buffer } from 'buffer';

export default {
	getStatus() {
		const data = {
			pid: process.pid,
			node: process.version,
			os: process.platform + process.arch,
			uptime: process.uptime()
		};
		return data;
	},
	base64Encode(str) {
		return Buffer.from(str).toString('base64');
	},
	base64Decode(data) {
		return Buffer.from(data, 'base64').toString('ascii');
	}
};
