const BetanoScrapper = require('./scrapper/BetanoScrapper');

const descriptor = {
    name: 'Betano',
	type: 'bookmaker'
};

module.exports = {
	descriptor,
	BetanoScrapper
}