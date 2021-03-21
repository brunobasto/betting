#!/usr/bin/env node
const fs = require('fs');

const { Bet365Scrapper } = require('betting-scrapper-bet365');
const { BetfairScrapper } = require('betting-scrapper-betfair');
const { PinnacleScrapper } = require('betting-scrapper-pinnacle');
const { BetanoScrapper } = require('betting-scrapper-betano');
const { BetWarriorScrapper } = require('betting-scrapper-betwarrior');

const { real } = require('../utils/currency');
const { findMatches } = require('../utils/screener');
const { computeOpportunities } = require('../utils/opportunities');
const { connect, Event } = require('betting-database');

var argv = require('yargs')
	.usage('Usage: $0 --from-cache')
	.describe('from-cache', 'Wether to use data from cache or nor')
	.boolean('from-cache')
	.argv;

const executeScrapper = async (scrapper, name) => {
	return new Promise((resolve, reject) => {
		scrapper.on('start', async () => console.log(name, 'started'));

		scrapper.on('error', async (error) => {
			console.log(name, error);

			reject(error);
		});

		scrapper.on('eventsBatch', (events) => {
			events.forEach(async (rawEvent) => {
				try {
					const event = await Event.fromRawData(rawEvent);
				
					await event.save();

					console.log(`Saved ${rawEvent.participants}`);
				}
				catch (error) {
					if (error.code === 11000) {
						console.log(`Event already on the database: [${rawEvent.entity.name}] ${rawEvent.participants}`);
					}
					else {
						console.log(error);
					}
				}
			})
		})

		scrapper.on('success', async (events) => {
			console.log('Found', events.length, 'on', name);

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
	await connect();

	try {
		let entityEvents = [];

		const database = `${__dirname}/data/entityEvents`;

		if (argv['from-cache'] && fs.existsSync(database)) {
			entityEvents = JSON.parse(fs.readFileSync(database))
		}
		else {
			const betfair = new BetfairScrapper();
			const bet365 = new Bet365Scrapper();
			const pinnacle = new PinnacleScrapper();
			const betano = new BetanoScrapper();
			const betwarrior = new BetWarriorScrapper();

			entityEvents = await Promise.all([
				// executeScrapper(bet365, 'bet365'),
				// executeScrapper(betfair, 'betfair'),
				// executeScrapper(pinnacle, 'pinnacle'),
				executeScrapper(betano, 'betano'),
				// executeScrapper(betwarrior, 'betwarrior'),
			]);

			fs.writeFileSync(database, JSON.stringify(entityEvents));
		}

		const matched = findMatches(entityEvents);

		const commission = 0.05;
		const desiredROI = 0.05;
		const exchangeFunds = 100;
		const bookmakerFunds = 100;
		const maxStake = exchangeFunds + bookmakerFunds;

		const opportunities = computeOpportunities(matched);

		const profitable = opportunities.filter(
			({ backer, backerLoss, backerProfit, backStake, layerLoss, liability, layer, layStake, layerProfit }) => {
				if (backer.backPlayer === '== Fake Back ==') {
					console.log('ACHOU', backStake, backer.backOdds, backerProfit, layStake, layer.layOdds, layerProfit);
				}
				return (
					// true
					// backerLoss < bookmakerFunds &&
					backerProfit > 0 &&
					// layerLoss < exchangeFunds &&
					layerProfit > 0
				)
			}
		);

		profitable.forEach(
			({
				backer,
				backerAward,
				backerLoss,
				backerProfit,
				backStake,
				layer,
				layerAward,
				layerLoss,
				layerProfit,
				layStake,
				liability,
				timeToMatch,
			}) => {
				const { backPlayer, layPlayer, backOdds } = backer;
				const { layOdds } = layer;

				console.log(backer, layer);

				console.log(`======== ${backer.entityName} (${backer.entityType}) v ${layer.entityName} (${layer.entityType}) =======`);
				console.log(`======= ${backPlayer} [${backOdds}] v ${layPlayer} [${layOdds}] ==============`);
				console.log(`===================================================`);

				console.log('Back Stake', real(backStake));
				console.log('Lay Stake', real(layStake));

				// console.log(`\nApostei ${real(backStake)} para ${backPlayer} ganhar`);
				// console.log(`Apostei ${real(layStake)} para ${backPlayer} perder`);
				console.log(`Liability: ${real(liability)}`);
				console.log(`Profit: ${real(backerProfit)}`);
				console.log(`ROI: ${(layerProfit / liability * 100).toFixed(2)}%`);
				console.log(`Back here: ${backer.link}`);
				console.log(`Lay here: ${layer.link}`);
				// console.log(`Average ROI: ${((layerProfit / liability + backerProfit / liability) / 2 * 100).toFixed(2)}%\n`);

				// console.log(`--- SE ${backPlayer} GANHAR ---`);
				// console.log(`Ganhei no backer: ${real(backerAward)}`);
				// console.log(`Perdi no layer: ${real(layerLoss)}`);
				// console.log(`Lucros ${real(backerProfit)}\n`)
				// console.log(`ROI: ${(backerProfit / liability * 100).toFixed(2)}%\n`);

				// console.log(`--- SE ${backPlayer} GANHAR ---`);
				// console.log(`Ganhei no layer: ${real(layerAward)}`);
				// console.log(`Perdi no backer: ${real(backerLoss)}`);
				// console.log(`Lucros ${real(layerProfit)}\n`);

				console.log(`Time to Match: ${timeToMatch}h\n\n`);
			}
		);

		console.log(`Total events ${entityEvents.reduce((a, {events}) => a + events.length, 0)}`)
		console.log(`Found ${matched.length} matches`);
		console.log(`That resulted in ${opportunities.length} opportunities.`);
		console.log(`Of which ${profitable.length} are profitable.`);

		process.exit(0);
	}
	catch (error) {
		console.error(error);

		process.exit(1);
	}
}
)()