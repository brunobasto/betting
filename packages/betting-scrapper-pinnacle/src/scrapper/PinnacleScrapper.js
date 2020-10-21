const { Scrapper } = require('betting-scrapper');

const getEvents = require('./getEvents');

class PinnacleScrapper extends Scrapper {
	async getEvents(page) {
		return await getEvents(page);
	}

	getURL() {
		return 'https://www.pinnacle.com/pt/tennis/matchups';
	}
}

module.exports = PinnacleScrapper;