const { TIMEOUT } = require('betting-scrapper');
const moment = require('moment');

module.exports = async (page) => {
	await page.waitForSelector('div[data-test-id="Event.Row"]', { timeout: TIMEOUT });

	const bets = await page.evaluate(
		async () => {
			const bets = [];

			try {
				const groupNodes = document.querySelectorAll('.contentBlock');

				for (let i = 0; i < groupNodes.length; i++) {
					const groupNode = groupNodes[i];
					const dateNode = groupNode.querySelector('div[data-test-id="Events.DateBar"]');
					const eventNodes = groupNode.querySelectorAll('div[data-test-id="Event.Row"]');

					for (let j = 0; j < eventNodes.length; j++) {
						const marketButtons = eventNodes[j].querySelectorAll('.style_colMarkets__2zo1K a[data-test-id="Event.MarketBtn"]')
						const playerNodes = eventNodes[j].querySelectorAll('.style_participants__1OLhG .style_participantName__vRjBw')
						const timeNode = eventNodes[j].querySelector('.style_time__24Qcs');

						if (timeNode && playerNodes.length && marketButtons.length) {
							bets.push({
								backPlayer: playerNodes[0].textContent,
								backOdds: Number(marketButtons[0].textContent),
								layPlayer: playerNodes[1].textContent,
								layOdds: Number(marketButtons[1].textContent),
								date: dateNode.textContent,
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

	moment.locale('pt_BR');

	return bets.map(({ time, ...bet }) => {
		let parsedDate = moment(`${time}`, "HH:mm");

		return {
			...bet,
			date: parsedDate.toDate(),
			entityType: 'bookmaker'
		}
	});
}