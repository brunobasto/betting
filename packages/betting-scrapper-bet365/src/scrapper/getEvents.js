const { TIMEOUT } = require('betting-scrapper');
const moment = require('moment');;

module.exports = async (page) => {
	await page.waitForSelector('.cm-CouponMarketGrid', { timeout: TIMEOUT });

	const bets = await page.evaluate(
		async () => {
			const bets = [];

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
					const layOddsNodes = oddsGroupsNodes[1].querySelectorAll('.sgl-ParticipantOddsOnly80_Odds')

					for (let j = 0; j < matchesNodes.length; j++) {
						const date = findDate(matchesNodes[j]);
						const playerNodes = matchesNodes[j].querySelectorAll('.rcl-ParticipantFixtureDetails_TeamWrapper')
						const timeNode = detailNodes[j].querySelector('.rcl-ParticipantFixtureDetails_BookCloses');

						if (date && timeNode) {
							bets.push({
								backPlayer: playerNodes[0].textContent,
								backOdds: Number(backOddsNodes[j].textContent),
								layPlayer: playerNodes[1].textContent,
								layOdds: Number(layOddsNodes[j].textContent),
								date,
								time: timeNode.textContent
							});
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

	return bets.map(({ date, time, ...bet }) => {
		let parsedDate = moment(`${date} ${time}`, "ddd D MMM HH:mm");

		return {
			...bet,
			date: parsedDate.toDate()
		}
	});
}