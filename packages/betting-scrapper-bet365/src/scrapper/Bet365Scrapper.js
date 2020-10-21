const { Scrapper } = require('betting-scrapper');

const getEvents = require('./getEvents');

class Bet365Scrapper extends Scrapper {
	async getEvents(page) {
		return await getEvents(page);
	}
}

module.exports = Bet365Scrapper;