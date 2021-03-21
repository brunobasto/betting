const { normalize } = require('betting-utils');
const { TIMEOUT } = require('betting-scrapper');
const fs = require('fs');

const { clickOnBreadcrumbItem } = require('./breadcrumb');

const database = `${__dirname}/.leagues_blacklist`;
let blacklist = {};

if (fs.existsSync(database)) {
    blacklist = JSON.parse(fs.readFileSync(database))
}

const LEAGUES_SELECTOR = '[class^="EventGroupList__WrapperCss"] a[class^="NavigationLink"]';
const EVENTS_SELECTOR = '[data-testid="event-item"]';

const forEachLeague = async (page, callback) => {
    await page.waitForSelector(LEAGUES_SELECTOR, { timeout: TIMEOUT });

    const leagues = await page.evaluate(async (selector) => {
        const leagues = [];
        const leaguesNodes = document.querySelectorAll(selector);

        for (const leagueNode of leaguesNodes) {
            const regionNode = leagueNode.querySelector('[class*="Subtitle"]');
            const nameNode = leagueNode.querySelector('[class*="Title"]');

            const name = nameNode.firstChild.textContent.trim();

            leagues.push(
                regionNode ?
                    [
                        regionNode.textContent.trim(),
                        name
                    ].join(' - ') :
                    name || leagueNode.textContent
            );
        }

        return Promise.resolve(leagues);
    }, LEAGUES_SELECTOR);

    const visited = {};

    for (let i = 0; i < leagues.length; i++) {
        const currentLeague = normalize(leagues[i]);

        if (visited[currentLeague] || blacklist[currentLeague]) {
            continue;
        }

        try {
            await page.waitForSelector(LEAGUES_SELECTOR, { timeout: TIMEOUT });

            await page.evaluate(async (selector, index) => {
                const leaguesNodes = document.querySelectorAll(selector);

                leaguesNodes.item(index).click();
            }, LEAGUES_SELECTOR, i);

            await page.waitForSelector(EVENTS_SELECTOR, { timeout: TIMEOUT });

            await callback(currentLeague);
        }
        catch (error) {
            blacklist[currentLeague] = true

            console.log(`Failed to visit league "${currentLeague}"`, error);

            fs.writeFileSync(database, JSON.stringify(blacklist, null, 1));
        }
        finally {
            visited[currentLeague] = true;

            await clickOnBreadcrumbItem(page, 1);
        }
    }
}

module.exports = {
    forEachLeague
}