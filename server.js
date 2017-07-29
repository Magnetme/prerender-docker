const prerender = require('prerender');
const forwardHeaders = require('./forwardHeaders');
const stripHtml = require('./stripHtml');
const healthcheck = require('./healthcheck');

const options = {
	workers : process.env.PRERENDER_NUM_WORKERS || 1,
	iterations : process.env.PRERENDER_NUM_ITERATIONS || 25,
	softIterations : process.env.PRERENDER_NUM_SOFT_ITERATIONS || 10,
	jsTimeout : process.env.JS_TIMEOUT || 30000,
	jsCheckTimeout : 10000,
	resourceDownloadTimeout: 20000,
	waitAfterLastRequest: 2000,
	logRequests: true,
};

console.log('Starting with options:', options);

const server = prerender(options);

server.use(healthcheck('_health'));
server.use(forwardHeaders);
server.use(prerender.sendPrerenderHeader());
server.use(prerender.removeScriptTags());
server.use(prerender.httpHeaders());
server.use(stripHtml);
server.use(prerender.s3HtmlCache());

server.start();

const shutdown = () => {
	console.log('Shutdown initiated');
	server.exit();
	// At this point prerender has started killing its phantom workers already.
	// We give it 5 seconds to quickly do so, and then halt the process. This
	// will ensure relatively rapid redeploys (prerender no longer accepts new
	// requests at this point
	setTimeout(() => {
		console.log('Prerender has shut down');
		process.exit();
	}, 5000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
