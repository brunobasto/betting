const moment = require('moment');

const { getEventKey } = require('./keys');
const { haveNameSimilarity, compareAbbreviated } = require('./aliases');

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

                    // Skip invalid events
                    if (eventA.backOdds === 0 || eventA.layOdds === 0 || eventB.backOdds === 0 || eventB.layOdds === 0) {
                        return false;
                    }

                    // We're only interested in comparing against the same sport
                    if (eventA.sport !== eventB.sport) {
                        return false;
                    }

                    // We're only interested in events across different entities
                    if (entityNameA === entityNameB) {
                        return false;
                    }

                    // We're only interested in comparing the same event
                    if (eventKeyA !== eventKeyB) {
                        if (
                            !haveNameSimilarity(eventA.backPlayer, eventB.backPlayer) ||
                            !haveNameSimilarity(eventA.layPlayer, eventB.layPlayer)
                        ) {
                            return false;
                        }

                        // if (
                        //     !compareAbbreviated(eventA.backPlayer, eventB.backPlayer) ||
                        //     !compareAbbreviated(eventA.layPlayer, eventB.layPlayer)
                        // ) {
                        //     // console.log(eventA.backPlayer, 'v', eventA.layPlayer, ' \n', eventB.backPlayer, 'v', eventB.layPlayer)
                        //     return false;
                        // }
                    }

                    const timeDiff = moment(eventA.date).diff(moment(eventB.date), 'hours');

                    // If time difference between two events is too great, it's probably a different event
                    if (Math.abs(timeDiff) > 4) {
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