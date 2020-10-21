const { Scrapper } = require('betting-scrapper');

const getEvents = require('./getEvents');

class Bet365Scrapper extends Scrapper {
	async getEvents(page) {
		return await getEvents(page);
	}

	getURL() {
		return 'https://www.betfair.com/exchange/plus/en/tennis-betting-2';
	}
}

module.exports = Bet365Scrapper;