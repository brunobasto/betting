const { EventEmitter } = require('events');

const { TIMEOUT } = require('../utils/constants');
const delay = require('../utils/delay');
const log = require('../utils/log');

const puppeteer = require('puppeteer-extra');

// Enable stealth plugin with all evasions
puppeteer.use(require('puppeteer-extra-plugin-stealth')())

const configs = {
	args: ['--no-sandbox', '--lang=en-US'],
	headless: true,
	timeout: TIMEOUT,
	devtools: false,
};

class Scrapper extends EventEmitter {
	async getEvents() {
		throw new Error('Not implemented.');
	}

	getURL() {
		throw new Error('Not implemented.');
	}

	async execute() {
		const browser = await this.createBrowser();

		try {
			const page = await this.createPage(browser);

			await delay(2000);

			await page.screenshot({ path: '/tmp/delayed.png' });

			this.emit('start');

			const result = await this.getEvents(page);

			this.emit('success', result);
		}
		catch (error) {
			console.log(error);

			await log(page);

			this.emit('error', error);
		}
		finally {
			this.emit('close');

			await browser.close();
		}
	}

	async createBrowser() {
		return await puppeteer.launch({ ...configs });
	}

	async createPage(browser) {
		const page = await browser.newPage();

		await page.setExtraHTTPHeaders({
			'Accept-Language': 'en-US'
		})

		const cookies = await page.cookies(this.getURL());
		// And remove them
		await page.deleteCookie(...cookies);

		await page.setViewport({ 
			width: 1375 + Math.floor(Math.random() * 100),
    		height: 768 + Math.floor(Math.random() * 100),
		 });
		await page.goto(this.getURL(), { waitUntil: 'domcontentloaded', timeout: 0 });

		await page.screenshot({ path: '/tmp/initial.png' });

		return page;
	}
}

module.exports = Scrapper;