const { calculateStakesWithLayOnExchange } = require('./calculus_exchange');
const { calculateStakesBetweenBookmakers } = require('./calculus_bookmaker');
const { canDraw } = require('./sports');

const computeOpportunities = (matchedEvents) => {
    const opportunities = [];

    matchedEvents.forEach((match) => {
        const { eventA, eventB } = match;

        // const probabilityA = 1 / eventA.backOdds + 1 / eventB.layOdds;
        // const probabilityB = 1 / eventA.layOdds + 1 / eventB.backOdds;

        // We're only interested in profitable opportunities
        // if (probabilityA >= 1 && probabilityB >= 1) {
        // 	return false;
        // }

        // If probabilityA < 1 we should back A and lay B
        // If probabilityB < we should back B and lay A

        // Analyze a few scenarios:
        // 1 - eventA and eventB are from bookmakers
        //   | - Calculate between bookmakers (Dutching) 
        // 2 - eventA is from a bookmaker and eventB is from an exchange
        // 3 - eventA is from an exchange and eventB is from a bookmaker
        // 4 - eventA and eventB are from exchanges

        if (eventA.entityType === 'bookmaker' && eventB.entityType === 'exchange') {
            // Backing A
            opportunities.push({
                ...match,
                backer: eventA,
                layer: eventB,
                ...calculateStakesWithLayOnExchange({ backOdds: eventA.backOdds, commission, layOdds: eventB.layOdds, maxStake }),
            });

            // Backing B
            if (!canDraw(eventB.sport)) {
                opportunities.push({
                    ...match,
                    backer: eventB,
                    layer: eventA,
                    ...calculateStakesBetweenBookmakers({ backOdds: eventB.backOdds, commission, layOdds: eventA.layOdds, maxStake }),
                });
            }
        }
        else if (eventA.entityType === 'exchange' && eventB.entityType === 'bookmaker') {
            // Backing A
            if (!canDraw(eventA.sport)) {
                opportunities.push({
                    ...match,
                    backer: eventA,
                    layer: eventB,
                    ...calculateStakesBetweenBookmakers({ backOdds: eventA.backOdds, layOdds: eventB.layOdds, maxStake }),
                });
            }

            // Backing B
            opportunities.push({
                ...match,
                backer: eventA,
                layer: eventB,
                ...calculateStakesWithLayOnExchange({ backOdds: eventB.backOdds, commission, layOdds: eventA.layOdds, maxStake }),
            });
        }
        else if (eventA.entityType === 'bookmaker' && eventB.entityType === 'bookmaker') {
            // Backing A
            opportunities.push({
                ...match,
                backer: eventA,
                layer: eventB,
                ...calculateStakesBetweenBookmakers({ backOdds: eventA.backOdds, layOdds: eventB.layOdds, maxStake }),
            });

            // Backing B
            opportunities.push({
                ...match,
                backer: eventA,
                layer: eventB,
                ...calculateStakesBetweenBookmakers({ backOdds: eventB.backOdds, layOdds: eventA.layOdds, maxStake }),
            });
        }
    })

    opportunities.sort((a, b) => a.backerProfit - b.backerProfit)

    return opportunities;
}

module.exports = {
    computeOpportunities
}