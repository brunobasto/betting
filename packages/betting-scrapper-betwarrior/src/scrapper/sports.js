const { TIMEOUT } = require('betting-scrapper');
const { normalize } = require('betting-utils');

const { clickOnBreadcrumbItem } = require('./breadcrumb');

const SPORTS_SELECTOR = '[class^="VerticalNavigation"] [class^="NavigationLink"]';
const LEAGUES_SELECTOR = '[id^="standard:level_type=league"] a';

const forEachSport = async (page, callback) => {
    await page.waitForSelector(SPORTS_SELECTOR, { timeout: TIMEOUT })

    const sports = await page.evaluate(async (selector) => {
        const sports = [];
        const sportsNodes = document.querySelectorAll(selector)

        for (const sportNode of sportsNodes) {
            sports.push({
                name: sportNode.textContent.trim(),
                url: sportNode.href
            });
        }

        return Promise.resolve(sports);
    }, SPORTS_SELECTOR);

    for (let i = 0; i < sports.length; i++) {
        const sport = {
            ...sports[i],
            name: normalize(sports[i].name)
        };

        try {
            await page.waitForSelector(SPORTS_SELECTOR, { timeout: TIMEOUT });

            await page.evaluate(async (selector, sportIndex) => {
                const sportsNodes = document.querySelectorAll(selector);
        
                sportsNodes.item(sportIndex).click();
            }, SPORTS_SELECTOR, i);
    
            await page.waitForSelector(LEAGUES_SELECTOR, { timeout: TIMEOUT });
    
            await callback(sport);
        }
        catch (error) {
            console.log('Failed to visit sport', sport, error);
        }
        finally {
            await clickOnBreadcrumbItem(page, 0);
        }
    }
}

module.exports = {
    forEachSport
}