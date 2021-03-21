const { TIMEOUT } = require('betting-scrapper');
const delay = require('betting-scrapper/src/utils/delay');
const moment = require('moment');

const sports = {
	TENNIS: 'https://www.betfair.com/exchange/plus/en/tennis-betting-2',
	SOCCER: 'https://www.betfair.com/exchange/plus/en/football-betting-1'
}

module.exports = async (page) => {
	const events = [];
	let selectedTime = false;
	let acceptedCookies = false;

	for (const sport of Object.keys(sports)) {
		await page.goto(sports[sport], { waitUntil: 'domcontentloaded', timeout: 0 });

		if (!acceptedCookies) {
			await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: TIMEOUT });
			await delay(2000);
			await page.click('#onetrust-accept-btn-handler', { timeout: TIMEOUT });

			acceptedCookies = true;
		}

		await page.waitForSelector('.bet-button-price', { timeout: TIMEOUT });

		if (!selectedTime) {
			await delay(1000);
			await page.click('.group-by-filter .selected-option');
			await page.click('.group-by-filter bf-option[value="time"] .option-list-item');
			selectedTime = true;
		}

		await page.waitForSelector('.bf-livescores-start-date', { timeout: TIMEOUT });

		const numberOfPages = await page.evaluate(async () => {
			return Promise.resolve(document.querySelectorAll('.coupon-page-navigation__bullets li').length);
		}) || 1;

		for (let i = 0; i < numberOfPages; i++) {
			const pageEvents = await page.evaluate(
				async () => {
					const events = [];

					try {
						const groupNodes = document.querySelectorAll('.coupon-card');

						for (let i = 0; i < groupNodes.length; i++) {
							const groupNode = groupNodes[i];
							const date = groupNode.querySelector('.card-header .card-header-title').textContent;
							const eventNodes = groupNode.querySelectorAll('tr');

							for (let j = 0; j < eventNodes.length; j++) {
								const linkNode = eventNodes[j].querySelector('.mod-link');
								const backOdds = eventNodes[j].querySelector('button.back-button .bet-button-price')
								const layOdds = eventNodes[j].querySelector('button.lay-button .bet-button-price')
								const playerNodes = eventNodes[j].querySelectorAll('.runners .name')
								const timeNode = eventNodes[j].querySelector('.bf-livescores .bf-livescores-start-date');

								if (timeNode && playerNodes.length && backOdds && layOdds) {
									events.push({
										backPlayer: playerNodes[0].textContent,
										backOdds: Number(backOdds.textContent),
										layPlayer: playerNodes[1].textContent,
										layOdds: Number(layOdds.textContent),
										link: linkNode.href,
										date,
										time: timeNode.textContent
									})
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

			events.push(...(pageEvents.map(({ date, ...bet }) => {
				const timeElements = bet.time.split(' ')
				let parsedDate;

				moment.locale('en_US');

				if (timeElements.length === 2) {
					parsedDate = moment(`${date} ${timeElements[1]}`, "ddd D MMM HH:mm");
				}
				else if (timeElements.length === 3) {
					parsedDate = moment(`${date} ${timeElements[2]}`, "ddd D MMM HH:mm");
				}
				else {
					console.log('Unkown date', bet.time);

					parsedDate = moment();
				}

				return {
					...bet,
					date: parsedDate.toDate(),
					entityType: 'exchange',
					entityName: 'betfair',
					sport
				}
			})));

			await delay(2000);

			if (i < numberOfPages - 1) {
				await page.click('.coupon-page-navigation__link--next');

				await page.waitForSelector('.bf-livescores-start-date', { timeout: TIMEOUT });
			}
		}
	}

	return events;
}