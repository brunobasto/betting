const { normalize } = require('betting-utils');

const collectEvents = (marketData) => {
	const collected = [];

	if (!marketData.data) {
		return collected;
	}

	const { data: { blocks } } = marketData;

	if (!Array.isArray(blocks)) {
		return collected;
	}

	for (const { events } of blocks) {
		for (const event of events) {
			collected.push({
				sport: event.sportId,
				league: normalize([
					event.regionName,
					event.leagueDescription
				].join(' - ')),
				date: new Date(event.startTime),
				isLive: event.liveNow,
				type: 'match',
				participants: event.participants ? event.participants.map(({ name }) => name) : [],
				entity: {
					name: 'betano',
					type: 'bookmaker'
				},
				markets: event.markets.map((market) => ({
					name: market.name,
					selections: market.selections.map((selection) => ({
						name: selection.name,
						odds: selection.price
					}))
				})),
			});
		}
	}

	return collected;
}

module.exports = {
	collectEvents
}