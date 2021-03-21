const BetWarriorScrapper = require('./scrapper/BetWarriorScrapper');

const descriptor = {
    name: 'BetWarrior',
	type: 'bookmaker'
};

module.exports = {
	descriptor,
	BetWarriorScrapper
}