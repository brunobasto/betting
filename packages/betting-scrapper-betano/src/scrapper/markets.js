const { TIMEOUT } = require('betting-scrapper');
const { normalize } = require('betting-utils');
const { waitAjaxResponse } = require('betting-utils');

const SELECTOR_MARKET_BUTTONS = '.events-tabs li .events-tabs-container__tab__item__button';

const forEachMarket = async (page, callback) => {
    await page.waitForSelector('.events-tabs', { timeout: TIMEOUT })

    const marketLabels = await page.evaluate(async (selector) => {
        const markets = [];
        const marketsNodes = document.querySelectorAll(selector)

        for (const marketNode of marketsNodes) {
            markets.push(marketNode.textContent.trim());
        }

        return Promise.resolve(markets);
    }, SELECTOR_MARKET_BUTTONS);

    for (let i = 0; i < marketLabels.length; i++) {
        const marketLabel = normalize(marketLabels[i]);

        try {
            let marketData;

            if (i === 0) {
                await page.reload({ waitUntil: 'domcontentloaded', timeout: TIMEOUT });

                marketData = JSON.parse(
                    await page.evaluate(
                        async () => {            
                            const json = document.body.querySelector('script').textContent;
    
                            return Promise.resolve(json.replace('window["initial_state"]=', ''));
                        }
                    )
                );
            }
            else {
                await page.waitForSelector(SELECTOR_MARKET_BUTTONS, { timeout: TIMEOUT });

                await page.evaluate(async (selector, marketIndex) => {
                    const marketsNodes = document.querySelectorAll(selector);
            
                    marketsNodes.item(marketIndex).click();
                }, SELECTOR_MARKET_BUTTONS, i);
    
                marketData = await waitAjaxResponse(page, 'br.betano.com/api');
            }

            await callback(marketLabel, marketData);
        }
        catch (error) {
            console.log(`Failed to visit market ${marketLabel} at index ${i}`, error);
        }
    }
}

module.exports = {
    forEachMarket
}