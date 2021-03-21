#!/usr/bin/env node
const fetch = require('cross-fetch');
const Scrapper = require('../scrapper/BetWarriorScrapper');

const withBody = (body) => ({
	method: 'post',
	body: JSON.stringify(body),
	headers: {
		"Content-Type": "application/json"
	}
});

var argv = require('yargs')
	.usage('Usage: $0 --endpoint')
	.describe('endpoint', 'Http endpoint that will receive job data')
	.argv;

(async () => {
	try {
		const { endpoint } = argv;

		const send = async (event, payload = {}) => {
			if (endpoint) {
				await fetch(
					`${endpoint}/${event}`,
					withBody(payload)
				);
			}

			console.log(event, payload);
		}

		const scrapper = new Scrapper();

		// login
		scrapper.on('start', async () => await send('start'));

		scrapper.on('error', async (error) => {
			await send('error', error);

			process.exit(1);
		});

		scrapper.on('success', async (results) => {
			await send('success', results);

			console.log(`Scrapped ${results.length} events.`);
        });
        
        scrapper.on('close', async () => {
			process.exit(0);
		});

		await scrapper.execute();
	}
	catch (error) {
		console.error(error);

		process.exit(1);
	}
})();