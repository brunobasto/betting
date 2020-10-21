const BetfairScrapper = require('./scrapper/BetfairScrapper');

const descriptor = {
    name: 'Betfair',
	sport: 'tennis'
};

module.exports = {
	descriptor,
	BetfairScrapper
}