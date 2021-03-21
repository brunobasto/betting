const { TIMEOUT } = require('betting-scrapper');
const moment = require('moment');

moment.locale('pt_BR');

const sports = {
	TENNIS: 'https://www.bet365.com/#/AC/B13/C1/D50/E2/F163/',
	SOCCER: [
		'https://www.bet365.com/#/AC/B1/C1/D13/E102/F16/',
		'https://www.bet365.com/#/AC/B1/C1/D13/E108/F16/',
		'https://www.bet365.com/#/AC/B1/C1/D13/E112/F16/',
		'https://www.bet365.com/#/AC/B1/C1/D13/E122/F16/',
	]
}

module.exports = async (page) => {
	const events = [];

	const scrapeURL = async (sport, url) => {
		await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 });

		await page.waitForSelector('.cm-CouponMarketGrid', { timeout: TIMEOUT });

		const currentSportEvents = await page.evaluate(
			async () => {
				const events = [];

				const findDate = (node) => {
					let childIndex = -1;
					const parentNode = node.closest('.rcl-ParticipantFixtureDetails');
					const sibblings = parentNode.parentElement.childNodes;

					for (let i = 0; i < sibblings.length; i++) {
						if (sibblings.item(i) === parentNode) {
							childIndex = i;

							break;
						}
					}

					if (childIndex === -1) {
						return null;
					}

					for (let i = childIndex; i > -1; i--) {
						if (sibblings.item(i).classList.contains('rcl-MarketHeaderLabel-isdate')) {
							return sibblings.item(i).textContent;
						}
					}

					return null;
				}

				try {
					const groupNodes = document.querySelectorAll('.src-CompetitionMarketGroup');

					for (let i = 0; i < groupNodes.length; i++) {
						const groupNode = groupNodes[i];
						const matchesNodes = groupNode.querySelectorAll('.rcl-ParticipantFixtureDetails_TeamAndScoresContainer');
						const detailNodes = groupNode.querySelectorAll('.rcl-ParticipantFixtureDetails_Details');

						const oddsGroupsNodes = groupNode.querySelectorAll('.sgl-MarketOddsExpand')
						const backOddsNodes = oddsGroupsNodes[0].querySelectorAll('.sgl-ParticipantOddsOnly80_Odds')
						const layOddsNodes = oddsGroupsNodes[oddsGroupsNodes.length - 1].querySelectorAll('.sgl-ParticipantOddsOnly80_Odds')

						for (let j = 0; j < matchesNodes.length; j++) {
							const date = findDate(matchesNodes[j]);
							const playerNodes = matchesNodes[j].querySelectorAll('.rcl-ParticipantFixtureDetails_TeamWrapper')
							const timeNode = detailNodes[j].querySelector('.rcl-ParticipantFixtureDetails_BookCloses');

							if (date && timeNode && playerNodes.length > 1 && backOddsNodes[j] && layOddsNodes[j]) {
								events.push({
									backPlayer: playerNodes[0].textContent,
									backOdds: Number(backOddsNodes[j].textContent),
									layPlayer: playerNodes[1].textContent,
									layOdds: Number(layOddsNodes[j].textContent),
									link: location.href,
									date,
									time: timeNode.textContent
								});
							}
						}
					}

					return Promise.resolve(events);
				}
				catch (error) {
					return Promise.reject(error);
				}
			}
		);

		events.push(
			...(currentSportEvents.map(({ date, time, ...event }) => {
				let parsedDate = moment(`${date} ${time}`, "ddd D MMM HH:mm");

				return {
					...event,
					date: parsedDate.toDate(),
					entityType: 'bookmaker',
					entityName: 'bet365',
					sport
				}
			}))
		);
	}

	for (const sport of Object.keys(sports)) {
		if (Array.isArray(sports[sport])) {
			for (const url of sports[sport]) {
				await scrapeURL(sport, url);
			}
		}
		else {
			await scrapeURL(sport, sports[sport]);
		}
	}

	return events;
}