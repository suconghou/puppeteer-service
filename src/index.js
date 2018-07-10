import process from 'process';
import httpserver from './lib/httpserver.js';
new httpserver(process.argv).run();
