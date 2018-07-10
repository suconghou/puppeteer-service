import process from 'process';
import httpserver from './lib/httpserver.js';
const port = 9090;
new httpserver(port, process.cwd()).run(process.argv);
