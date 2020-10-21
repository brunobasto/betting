const moment = require('moment');

const { getEventKey } = require('./keys');

const findMatches = (scrapperResults) => {
    const matched = [];
    const index = {};

    scrapperResults.forEach(({events: eventsA, name: entityNameA}) => {
        scrapperResults.forEach(({events: eventsB, name: entityNameB}) => {
            eventsA.forEach(eventA => {
                eventsB.forEach(eventB => {
                    const eventKeyA = getEventKey(eventA);
                    const eventKeyB = getEventKey(eventB);

                    // Skip if we already processed it
                    if (
                        index[`${eventKeyA}_${entityNameA}_${eventKeyB}_${entityNameB}`] ||
                        index[`${eventKeyB}_${entityNameB}_${eventKeyA}_${entityNameA}`]
                    ) {
                        return false;
                    }

                    // We're only interested in events across different entities
                    if (entityNameA === entityNameB) {
                        return false;
                    }

                    // We're only interested in comparing the same event
                    if (eventKeyA !== eventKeyB) {
                        return false;
                    }

                    const timeDiff = moment(eventA.date).diff(moment(eventB.date), 'hours');

                    // If time difference between two events is too great, it's probably a different event
                    if (Math.abs(timeDiff) > 2) {
                        // return false;
                    }

                    const probabilityA = 1 / eventA.backOdds + 1 / eventB.layOdds;
                    const probabilityB = 1 / eventA.layOdds + 1 / eventB.backOdds;

                    // We're only interested in profitable opportunities
                    if (probabilityA >= 1 && probabilityB >= 1) {
                        return false;
                    }

                    // Events too far in the future are risky
                    const nowDiff = moment(eventA.date).diff(moment(), 'hours');

                    if (nowDiff > 24) {
                        // return false;
                    }

                    matched.push({
                        eventA,
                        eventB,
                        entityNameA,
                        entityNameB,
                        probabilityA,
                        probabilityB,
                        timeToMatch: nowDiff
                    })

                    index[`${eventKeyA}_${entityNameA}_${eventKeyB}_${entityNameB}`] = true;
                    index[`${eventKeyB}_${entityNameB}_${eventKeyA}_${entityNameA}`] = true;
                })
            })
        })
    });

    return matched;
}

module.exports = {
    findMatches
}