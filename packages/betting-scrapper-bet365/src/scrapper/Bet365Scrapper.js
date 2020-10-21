const { Scrapper } = require('betting-scrapper');

const getEvents = require('./getEvents');

class Bet365Scrapper extends Scrapper {
	async getEvents(page) {
		return await getEvents(page);
	}

	getURL() {
		return 'https://www.bet365.com/#/AC/B13/C1/D50/E2/F163/';
	}
}

module.exports = Bet365Scrapper;