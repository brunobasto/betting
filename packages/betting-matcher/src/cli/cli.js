#!/usr/bin/env node

const { Bet365Scrapper } = require('betting-scrapper-bet365');
const { BetfairScrapper } = require('betting-scrapper-betfair');
const { PinnacleScrapper } = require('betting-scrapper-pinnacle');

const { real } = require('../utils/currency');
const { calculateStakesWithLayOnExchange } = require('../utils/calculus_exchange');
const { findMatches } = require('../utils/screener');
const { calculateStakesBetweenBookmakers } = require('../utils/calculus_bookmaker');

var argv = require('yargs')
	.usage('Usage: $0 --endpoint')
	.describe('endpoint', 'Http endpoint that will receive job data')
	.argv;

const executeScrapper = async (scrapper, name) => {
	return new Promise((resolve, reject) => {
		scrapper.on('start', async () => console.log(name, 'started'));

		scrapper.on('error', async (error) => {
			console.log(name, error);

			reject(error);
		});

		scrapper.on('success', async (events) => {
			console.log(name, 'has', events.length, 'matches');

			resolve({
				events,
				name,
				scrapper
			});
		});

		scrapper.execute();
	});
}

(async () => {
	const betfair = new BetfairScrapper();
	const bet365 = new Bet365Scrapper();
	const pinnacle = new PinnacleScrapper();

	try {
		const entityEvents = await Promise.all([
			executeScrapper(bet365, 'bet365'),
			executeScrapper(betfair, 'betfair'),
			executeScrapper(pinnacle, 'pinnacle'),
		]);

		const matched = findMatches(entityEvents);

		const commission = 0.05;
		const desiredROI = 0.05;
		const exchangeFunds = 138.67;
		const bookmakerFunds = 41.36;
		const maxStake = exchangeFunds + bookmakerFunds;

		const opportunities = [];

		console.log(`Found ${matched.length} matches`);

		matched.forEach((match) => {
			const { eventA, eventB, probabilityA, probabilityB } = match;

			// If probabilityA < 1 we should back A and lay B
			// If probabilityB < we should back B and lay A

			// Analyze a few scenarios:
			// 1 - eventA and eventB are from bookmakers
			//   | - Calculate between bookmakers (Dutching) 
			// 2 - eventA is from a bookmaker and eventB is from an exchange
			// 3 - eventA is from an exchange and eventB is from a bookmaker
			// 4 - eventA and eventB are from exchanges

			if (probabilityA < 1) {
				if (eventA.entityType === 'bookmaker' && eventB.entityType === 'exchange') {
					const stakes = calculateStakesWithLayOnExchange({ backOdds: eventA.backOdds, commission, layOdds: eventB.layOdds, maxStake });

					opportunities.push({ ...stakes, ...match });
				}
				else if (eventA.entityType === 'bookmaker' && eventB.entityType === 'bookmaker') {
					console.log('A')
					const stakes = calculateStakesBetweenBookmakers({ backOdds: eventA.backOdds, layOdds: eventB.layOdds, maxStake });

					opportunities.push({ ...stakes, ...match });
				}
			}

			if (probabilityB < 1) {
				if (eventA.entityType === 'exchange' && eventB.entityType === 'bookmaker') {
					const stakes = calculateStakesWithLayOnExchange({ backOdds: eventB.backOdds, commission, layOdds: eventA.layOdds, maxStake });

					opportunities.push({ ...stakes, ...match });
				}
				else if (eventA.entityType === 'bookmaker' && eventB.entityType === 'bookmaker') {
					console.log('B')
					const stakes = calculateStakesBetweenBookmakers({ backOdds: eventB.backOdds, layOdds: eventA.layOdds, maxStake });

					opportunities.push({ ...stakes, ...match });
				}
			}
		})

		console.log(`That resulted in ${opportunities.length} opportunities.`);
		
		const profitable = opportunities.filter(
			({ backerLoss, backerProfit, layerLoss, liability, layerProfit }) => {
				return (
					// true
					backerLoss < bookmakerFunds &&
					backerProfit / liability > desiredROI &&
					layerLoss < exchangeFunds &&
					layerProfit / liability > desiredROI
				)
			}
		);

		profitable.forEach(
			({
				backerAward,
				backerLoss,
				backerProfit,
				backStake,
				bookmaker,
				bookmakerName,
				exchange,
				exchangeName,
				layerAward,
				layerLoss,
				layerProfit,
				layStake,
				liability,
				timeToMatch,
			}) => {
				const { backPlayer, layPlayer, backOdds } = bookmaker;
				const { layOdds } = exchange;

				console.log(`======== ${bookmakerName} v ${exchangeName} =======`);
				console.log(`======= ${backPlayer} v ${layPlayer} ==============`);
				console.log(`===================================================`);

				console.log('Back Odds', backOdds, 'Back Stake', real(backStake));
				console.log('Lay Odds', layOdds, 'Lay Stake', real(layStake));

				console.log(`\nApostei ${real(backStake)} para ${backPlayer} ganhar`);
				console.log(`Apostei ${real(layStake)} para ${backPlayer} perder`);
				console.log(`Liability: ${real(liability)}\n`);


				console.log(`--- SE ${backPlayer} GANHAR ---`);
				console.log(`Ganhei no bookmaker: ${real(backerAward)}`);
				console.log(`Perdi no exchange: ${real(layerLoss)}`);
				console.log(`Lucros ${real(backerProfit)}\n`)
				console.log(`ROI: ${(backerProfit / liability * 100).toFixed(2)}%\n`);

				console.log(`--- SE ${backPlayer} PERDER ---`);
				console.log(`Ganhei no exchange: ${real(layerAward)}`);
				console.log(`Perdi no bookmaker: ${real(backerLoss)}`);
				console.log(`Lucros ${real(layerProfit)}\n`);
				console.log(`ROI: ${(layerProfit / liability * 100).toFixed(2)}%\n`);

				console.log(`Average ROI: ${((layerProfit / liability + backerProfit / liability) / 2 * 100).toFixed(2)}%\n`);

				console.log(`Time to Match: ${timeToMatch}h\n\n`);
			}
		);

		console.log(`Of which ${profitable.length} are profitable.`);

		process.exit(0);
	}
	catch (error) {
		console.error(error);

		process.exit(1);
	}
})();