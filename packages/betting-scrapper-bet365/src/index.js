const Bet365Scrapper = require('./scrapper/Bet365Scrapper');

const descriptor = {
    name: 'Bet365',
	sport: 'tennis'
};

module.exports = {
	descriptor,
	Bet365Scrapper
}