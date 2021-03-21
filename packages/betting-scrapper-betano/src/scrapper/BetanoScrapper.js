const { Scrapper } = require('betting-scrapper');

const { collectEvents } = require('./events');
const { forEachLeague } = require('./leagues');
const { forEachMarket } = require('./markets');
const { forEachSport } = require('./sports');

const getEventKey = (event) => {
	return [
		event.sport,
		event.league,
		event.date,
		event.participants.join('x')
	]
}

class BetanoScrapper extends Scrapper {
	async getEvents(page) {
		const allEvents = {};

		await forEachSport(page, async (sport) => {
			await forEachLeague(page, async (league) => {
				const leagueEvents = {};

				await forEachMarket(page, async (market, marketData) => {
					try {
						const pageEvents = collectEvents(marketData);
						const normalized = pageEvents.map((event) => ({
							...event,
							sport: sport.name,
						}));

						normalized.forEach((newEvent) => {
							const newKey = getEventKey(newEvent);

							if (allEvents[newKey]) {
								const mergedEvent = {
									...allEvents[newKey],
									markets: [
										...allEvents[newKey].markets,
										...newEvent.markets
									]
								}

								allEvents[newKey] = mergedEvent;
								leagueEvents[newKey] = mergedEvent;	
							}
							else {
								allEvents[newKey] = newEvent;
								leagueEvents[newKey] = newEvent;
							}
						});
					}
					catch (error) {
						console.log('Failed to collect events', error);
					}
				});

				this.emit('eventsBatch', Object.values(leagueEvents));
			});
		});

		return Object.values(allEvents);
	}

	getURL() {
		return 'https://br.betano.com/pt/';
	}
}

module.exports = BetanoScrapper;