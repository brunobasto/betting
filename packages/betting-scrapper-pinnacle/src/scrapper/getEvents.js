const { TIMEOUT } = require('betting-scrapper');
const moment = require('moment');

module.exports = async (page) => {
	await page.waitForSelector('div[data-test-id="Event.Row"]', { timeout: TIMEOUT });

	const bets = await page.evaluate(
		async () => {
			const bets = [];

			var getPreviousSibling = function (elem, selector) {

				// Get the next sibling element
				var sibling = elem.previousElementSibling;
			
				// If there's no selector, return the first sibling
				if (!selector) return sibling;
			
				// If the sibling matches our selector, use it
				// If not, jump to the next sibling and continue the loop
				while (sibling) {
					if (sibling.matches(selector)) return sibling;
					sibling = sibling.previousElementSibling;
				}
			
			};

			try {
				const groupNodes = document.querySelectorAll('.contentBlock');

				for (let i = 0; i < groupNodes.length; i++) {
					const groupNode = groupNodes[i];
					const eventNodes = groupNode.querySelectorAll('div[data-test-id="Event.Row"]');

					for (let j = 0; j < eventNodes.length; j++) {
						const dateNode = getPreviousSibling(eventNodes[j], 'div[data-test-id="Events.DateBar"]')
						const linkNode = eventNodes[j].querySelector('a[data-test-id="Event.GameInfo"]');
						const marketButtons = eventNodes[j].querySelectorAll('.style_colMarkets__2zo1K a[data-test-id="Event.MarketBtn"]')
						const playerNodes = eventNodes[j].querySelectorAll('.style_participants__1OLhG .style_participantName__vRjBw')
						const timeNode = eventNodes[j].querySelector('.style_time__24Qcs');

						if (timeNode && playerNodes.length && marketButtons.length) {
							bets.push({
								backPlayer: playerNodes[0].textContent,
								backOdds: Number(marketButtons[0].textContent),
								layPlayer: playerNodes[1].textContent,
								layOdds: Number(marketButtons[1].textContent),
								link: linkNode.href,
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

	moment.locale('en_US');

	return bets.map(({ date, time, ...bet }) => {
		let parsedDate = moment(`${time}`, "HH:mm");

		if (date.toLowerCase() === 'tomorrow') {
			parsedDate = parsedDate.add(1, 'days');
		}

		return {
			...bet,
			date: parsedDate.toDate(),
			entityType: 'bookmaker',
			entityName: 'pinnacle',
			sport: 'TENNIS'
		}
	});
}