const { Scrapper } = require('betting-scrapper');

const { collectEvent, forEachEvent } = require('./events');
const { forEachLeague } = require('./leagues');
const { forEachSport } = require('./sports');

class BetWarriorScrapper extends Scrapper {
	async getEvents(page) {
		const events = [];

		await forEachSport(page, async (sport) => {
			await forEachLeague(page, async (league) => {
				const eventsBatch = [];

				await forEachEvent(page, async (eventData) => {
					try {
						const event = {
							...collectEvent(eventData),
							sport: sport.name,
							league
						};

						eventsBatch.push(event);
					}
					catch (error) {
						console.log('Failed to collect events', error);
					}
				});

				this.emit('eventsBatch', eventsBatch);

				events.push(...eventsBatch);
			});
		});

		return events;
	}

	getURL() {
		return 'https://betwarrior.bet/pt-br/sports';
	}
}

module.exports = BetWarriorScrapper;