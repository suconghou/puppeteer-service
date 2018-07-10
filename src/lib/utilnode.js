import process from 'process';
import os from 'os';
import { Buffer } from 'buffer';

export default {
	getStatus() {
		const data = {
			pid: process.pid,
			node: process.version,
			os: process.platform + process.arch,
			freemem: Math.round(os.freemem() / 1048576),
			allmem: Math.round(os.totalmem() / 1048576),
			cpus: os.cpus(),
			load: os.loadavg(),
			uptime: process.uptime(),
			memory: process.memoryUsage()
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
