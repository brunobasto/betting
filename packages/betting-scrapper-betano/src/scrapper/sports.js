const { TIMEOUT } = require('betting-scrapper');
const { normalize } = require('betting-utils');

const SPORTS_SELECTOR = '.sport-picker__item__inline__link';

const forEachSport = async (page, callback) => {
    await page.waitForSelector(SPORTS_SELECTOR, { timeout: TIMEOUT })

    const sports = await page.evaluate(async (selector) => {
        const sports = [];
        const sportsNodes = document.querySelectorAll(selector)

        for (const sportNode of sportsNodes) {
            sports.push({ name: sportNode.textContent.trim(), url: sportNode.href });
        }

        return Promise.resolve(sports);
    }, SPORTS_SELECTOR);

    for (let sport of sports) {
        sport = {
            ...sport,
            name: normalize(sport.name)
        };

        try {
            await page.goto(sport.url, { waitUntil: 'load', timeout: 0 });

            await callback(sport);
        }
        catch (error) {
            console.log('Failed to visit sport', sport);
        }
    }
}

module.exports = {
    forEachSport
}