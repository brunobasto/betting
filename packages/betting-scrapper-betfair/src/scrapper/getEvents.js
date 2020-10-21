const { TIMEOUT } = require('betting-scrapper');
const moment = require('moment');

module.exports = async (page) => {
	await page.waitForSelector('.bet-button-price', { timeout: TIMEOUT });

	await page.click('.group-by-filter .selected-option');
	await page.click('.group-by-filter bf-option[value="time"] .option-list-item');

	await page.waitForSelector('.bf-livescores-start-date', { timeout: TIMEOUT });

	const numberOfPages = await page.evaluate(async () => {
		return Promise.resolve(document.querySelectorAll('.coupon-page-navigation__bullets li').length);
	});

	const bets = [];

	for (let i = 0; i < numberOfPages; i++) {
		const pageBets = await page.evaluate(
			async () => {
				const bets = [];

				try {
					const groupNodes = document.querySelectorAll('.coupon-card');

					for (let i = 0; i < groupNodes.length; i++) {
						const groupNode = groupNodes[i];
						const date = groupNode.querySelector('.card-header .card-header-title').textContent;
						const matchesNodes = groupNode.querySelectorAll('tr');

						for (let j = 0; j < matchesNodes.length; j++) {
							const backOdds = matchesNodes[j].querySelector('button.back-button .bet-button-price')
							const layOdds = matchesNodes[j].querySelector('button.lay-button .bet-button-price')
							const playerNodes = matchesNodes[j].querySelectorAll('.runners .name')
							const timeNode = matchesNodes[j].querySelector('.bf-livescores .bf-livescores-start-date');

							if (timeNode && playerNodes.length && backOdds && layOdds) {
								bets.push({
									backPlayer: playerNodes[0].textContent,
									backOdds: Number(backOdds.textContent),
									layPlayer: playerNodes[1].textContent,
									layOdds: Number(layOdds.textContent),
									date,
									time: timeNode.textContent
								})
							}
						}
					}

					return Promise.resolve(bets);
				}
				catch (error) {
					return Promise.reject(error);
				}
			}
		);

		bets.push(...pageBets);

		if (i < numberOfPages - 1) {
			await page.click('.coupon-page-navigation__link--next');

			await page.waitForSelector('.bf-livescores-start-date', { timeout: TIMEOUT });
		}
	}

	moment.locale('pt_BR');

	return bets.map(({ date, ...bet }) => {
		const [, time] = bet.time.split(' ')
		let parsedDate = moment(`${date} ${time}`, "ddd D MMM HH:mm");

		return {
			...bet,
			date: parsedDate.toDate()
		}
	});
}