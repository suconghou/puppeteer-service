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
	},
	async body(request, max = 1048576) {
		return await new Promise((resolve, reject) => {
			let buf = [], count = 0;
			request
				.on('error', reject)
				.on('aborted', reject)
				.on('data', (data) => {
					buf.push(data);
					count += data.length;
					if (count > max) {
						reject('body too large');
					}
				}).on('end', () => {
					resolve(Buffer.concat(buf));
				});
		});
	}
};
