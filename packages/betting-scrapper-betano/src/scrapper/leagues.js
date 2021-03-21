const fs = require('fs');
const { normalize } = require('betting-utils');
const { TIMEOUT } = require('betting-scrapper');

const database = `${__dirname}/.leagues_blacklist`;
let blacklist = {};

if (fs.existsSync(database)) {
    blacklist = JSON.parse(fs.readFileSync(database))
}

const forEachLeague = async (page, callback) => {
    const sportURL = page.url();

    await page.waitForSelector('.sb-checkbox__link', { timeout: TIMEOUT });

    const leagues = await page.evaluate(async () => {
        const leagues = [];
        const leaguesNodes = document.querySelectorAll('.sb-checkbox__link')

        for (const leagueNode of leaguesNodes) {
            leagues.push(leagueNode.textContent.trim());
        }

        return Promise.resolve(leagues);
    });

    const visited = {};

    for (let i = 0; i < leagues.length; i++) {
        const currentLeague = normalize(leagues[i]);

        if (visited[currentLeague] || blacklist[currentLeague]) {
            continue;
        }

        try {
            await page.evaluate(async (leagueIndex) => {
                const leaguesNodes = document.querySelectorAll('.sb-checkbox__link')
        
                leaguesNodes.item(leagueIndex).click();
            }, i);
    
            await page.waitForSelector('.league-page__block__header__title__name', { timeout: 2000 });
    
            const leagueName = await page.evaluate(element => element.textContent.trim(), await page.$('.league-page__block__header__title__name'));
    
            await callback(normalize(leagueName));
        }
        catch (error) {
            blacklist[currentLeague] = true

            console.log(`Failed to visit league "${currentLeague}"`);

            console.error(error);

            fs.writeFileSync(database, JSON.stringify(blacklist, null, 1));
        }
        finally {
            try {
                await page.click('.sport-picker__item__expanded a', { timeout: TIMEOUT });
                await page.waitForSelector('.sb-checkbox__link', { timeout: TIMEOUT });
            }
            catch (error) {
                await page.goto(sportURL, { waitUntil: 'domcontentloaded', timeout: 0 });
                await page.waitForSelector('.sb-checkbox__link', { timeout: TIMEOUT });
            }

            visited[currentLeague] = true;
        }
    }
}

module.exports = {
    forEachLeague
}