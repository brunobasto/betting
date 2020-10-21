#!/usr/bin/env node
const { Bet365Scrapper } = require('betting-scrapper-bet365');
const { BetfairScrapper } = require('betting-scrapper-betfair');
const moment = require('moment');
const { getBetKey } = require('../utils/keys');
const { real } = require('../utils/currency');
const { calculateStakes } = require('../utils/calculus');

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

		scrapper.on('success', async (result) => {
			console.log(name, 'has', result.length, 'matches');

			resolve(result);
		});

		scrapper.execute();
	})

}

(async () => {
	const betfair = new BetfairScrapper();
	const bet365 = new Bet365Scrapper();

	try {
		const [betfairResults, bet365Results] = await Promise.all([
			executeScrapper(betfair, 'betfair'),
			executeScrapper(bet365, 'bet365')
		]);

		const matched = [];
		const index = {};

		betfairResults.forEach((exchange) => {
			bet365Results.forEach(bookmaker => {
				const bookmakerKey = getBetKey(bookmaker);
				const exchangeKey = getBetKey(exchange);

				// Skip if we already processed it
				if (index[bookmakerKey] || index[exchangeKey]) {
					return false;
				}

				// We're only interested in comparing the same event
				if (bookmakerKey !== exchangeKey) {
					return false;
				}

				const timeDiff = moment(bookmaker.date).diff(moment(exchange.date), 'hours');

				// If time difference between two events is too great, it's probably a different event
				if (Math.abs(timeDiff) > 2) {
					return false;
				}

				// const bestBack = Math.max(bookmaker.backOdds, exchange.backOdds);
				// const bestLay = Math.max(bookmaker.layOdds, exchange.layOdds);

				// // Ignore flaky resutls within same entity
				// if (
				// 	(bestBack === bookmaker.backOdds && bestLay === bookmaker.layOdds) ||
				// 	(bestBack === exchange.backOdds && bestLay === exchange.layOdds)
				// ) {
				// 	return false;
				// }

				const probability = 1 / bookmaker.backOdds + 1 / exchange.layOdds;

				// We're only interested in profitable opportunities
				if (probability >= 1) {
					return false;
				}

				// Events too far in the future are risky
				const nowDiff = moment(exchange.date).diff(moment(), 'hours');

				if (nowDiff > 24) {
					// return false;
				}

				matched.push({
					exchange,
					bookmaker,
					backPlayer: exchange.backPlayer,
					layPlayer: exchange.layPlayer,
					probability: probability,
					timeToMatch: nowDiff
				})

				index[bookmakerKey] = true;
			})
		})

		matched.sort((a, b) => a.probability - b.probability);

		const commission = 0.05;
		const desiredROI = 0.03;
		const maxStake = 200;
		const exchangeFunds = 100;
		const bookmakerFunds = 100;

		const filtered = matched.map((bet) => {
			const { bookmaker, exchange } = bet;
			const { layOdds } = exchange;
			const { backOdds } = bookmaker;

			const stakes = calculateStakes({ backOdds, commission, layOdds, maxStake });

			console.log(stakes)

			return {
				...stakes,
				...bet
			}
		}).filter(
			({ bookmakerLoss, bookmakerProfit, exchangeLoss, liability }) => {
				return (
					true
					// bookmakerLoss < bookmakerFunds &&
					// exchangeLoss < exchangeFunds &&
					// bookmakerProfit/liability > desiredROI
				)
			}
		);

		filtered.forEach(
			({
				backStake,
				bookmaker,
				bookmakerAward,
				bookmakerLoss,
				bookmakerProfit,
				exchange,
				exchangeAward,
				exchangeLoss,
				exchangeProfit,
				layStake,
				liability,
				timeToMatch
			}) => {
				const { backPlayer, layPlayer, backOdds } = bookmaker;
				const { layOdds } = exchange;

				console.log(`============================================`);
				console.log(`======= ${backPlayer} v ${layPlayer} =======`);
				console.log(`============================================`);

				console.log('Back Odds', backOdds, 'Back Stake', real(backStake));
				console.log('Lay Odds', layOdds, 'Lay Stake', real(layStake));

				console.log(`\nApostei ${real(backStake)} para ${backPlayer} ganhar`);
				console.log(`Apostei ${real(layStake)} para ${backPlayer} perder`);
				console.log(`Liability: ${real(liability)}\n`);
				

				console.log(`--- SE ${backPlayer} GANHAR ---`);
				console.log(`Ganhei no bookmaker: ${real(bookmakerAward)}`);
				console.log(`Perdi no exchange: ${real(exchangeLoss)}`);
				console.log(`Lucros ${real(bookmakerProfit)}\n`)
				console.log(`ROI: ${(bookmakerProfit/liability * 100).toFixed(2)}%\n`);

				console.log(`--- SE ${backPlayer} PERDER ---`);
				console.log(`Ganhei no exchange: ${real(exchangeAward)}`);
				console.log(`Perdi no bookmaker: ${real(bookmakerLoss)}`);
				console.log(`Lucros ${real(exchangeProfit)}\n`);
				console.log(`ROI: ${(exchangeProfit/liability * 100).toFixed(2)}%\n`);

				console.log(`Average ROI: ${((exchangeProfit/liability + bookmakerProfit/liability) / 2 * 100).toFixed(2)}%\n`);

				console.log(`Time to Match: ${timeToMatch}h\n\n`);
			}
		)
		console.log(`Found ${filtered.length} opportunities.`);

		process.exit(0);
	}
	catch (error) {
		console.error(error);

		process.exit(1);
	}
})();