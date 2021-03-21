const { Entity } = require('./entities/model');
const { Event } = require('./events/model');
const { connect } = require('./index');

var stringSimilarity = require('string-similarity');

const s2 = require('string-similarity-js');


;(function () {
    JaroWrinker  = function (s1, s2) {
    var m = 0;

    // Exit early if either are empty.
    if ( s1.length === 0 || s2.length === 0 ) {
        return 0;
    }

    // Exit early if they're an exact match.
    if ( s1 === s2 ) {
        return 1;
    }

    var range = (Math.floor(Math.max(s1.length, s2.length) / 2)) - 1,
        s1Matches = new Array(s1.length),
        s2Matches = new Array(s2.length);

    for ( i = 0; i < s1.length; i++ ) {
        var low  = (i >= range) ? i - range : 0,
            high = (i + range <= s2.length) ? (i + range) : (s2.length - 1);

        for ( j = low; j <= high; j++ ) {
            if ( s1Matches[i] !== true && s2Matches[j] !== true && s1[i] === s2[j] ) {
                ++m;
                s1Matches[i] = s2Matches[j] = true;
                break;
            }
        }
    }

    // Exit early if no matches were found.
    if ( m === 0 ) {
        return 0;
    }

    // Count the transpositions.
    var k = n_trans = 0;

    for ( i = 0; i < s1.length; i++ ) {
        if ( s1Matches[i] === true ) {
        for ( j = k; j < s2.length; j++ ) {
            if ( s2Matches[j] === true ) {
            k = j + 1;
            break;
            }
        }

        if ( s1[i] !== s2[j] ) {
            ++n_trans;
        }
        }
    }

    var weight = (m / s1.length + m / s2.length + (m - (n_trans / 2)) / m) / 3,
        l      = 0,
        p      = 0.1;

    if ( weight > 0.7 ) {
        while ( s1[l] === s2[l] && l < 4 ) {
        ++l;
        }

        weight = weight + l * p * (1 - weight);
    }

    return weight;
}
})();

(async () => {
    try {
        await connect();

        console.log(stringSimilarity.compareTwoStrings('Sporting Lisbon', 'Sporting CP'))
        console.log(stringSimilarity.compareTwoStrings('Paços Ferreira', 'FC Pacos Ferreira'))
        console.log(stringSimilarity.compareTwoStrings('Pumas UNAM', 'UNAM Pumas'))

        console.log(s2.default('Sporting Lisbon', 'Sporting CP'))
        console.log(s2.default('Paços Ferreira', 'FC Pacos Ferreira'))
        console.log(s2.default('Pumas UNAM', 'UNAM Pumas'))
        // console.log(Cosinesimilarity('Pumas', 'UNAM']).find('Pumas UNAM'))
        // console.log(similarity('Sporting Lisbon', 'Sporting CP'))

        const betWarriorEvents = await Event.find({
            entity: await Entity.findOne({ name: 'betwarrior' })
        });

        // Get all leagues, depupe, order alphabetically so we can start registering aliases

        const leagues = {};

        await Promise.all(
            betWarriorEvents.map(async (eventA) => {
                const betanoEvents = await Event.find({
                    entity: await Entity.findOne({ name: 'betano' }),
                    date: eventA.date,
                    // league: {$ne: eventA.league},
                    sport: eventA.sport,
                    participants: eventA.participants
                });

                if (eventA.participants.length < 2) {
                    return;
                }

                if (betanoEvents.length) {
                    leagues[eventA.league] = 1;

                    for (const eventB of betanoEvents) {
                        if (eventA.participants.length !== eventB.participants.length) {
                            continue;
                        }

                        console.log(eventA.participants, betanoEvents[0].participants);

                        leagues[eventB.league] = 1;

                        for (const marketA of eventA.markets) {
                            for (const marketB of eventB.markets) {
                                if (
                                    stringSimilarity.compareTwoStrings(marketA.name, marketB.name) > 0.7 &&
                                    marketA.selections.length === marketB.selections.length
                                ) {
                                    // console.log(marketA.name, '=====', marketB.name)
                                    // console.log(eventA.league, '=====', eventB.league)
                                    // console.log('Matching markets')
                                }
                            }
                        }
                    }
                    // console.log(eventA.sport, betanoEvents[0].sport);
                    // console.log(eventA.league, betanoEvents[0].league);
                    // console.log(eventA.participants, betanoEvents[0].participants);
                    // console.log(`Found ${betanoEvents.length} matches.`);

                    
                }
            })
        );

        const array = Object.keys(leagues);

        array.sort();

        console.log(array, array.length);

        // await Event.deleteMany({ entity: await Entity.findOne({ name: 'betano' }) })
    }
    catch (error) {
        console.error(error);
    }
    finally {
        process.exit(0);
    }
})();