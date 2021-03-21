const { normalize, waitAjaxResponse } = require('betting-utils');
const { TIMEOUT } = require('betting-scrapper');
const fs = require('fs');

const { clickOnBreadcrumbItem } = require('./breadcrumb');

const database = `${__dirname}/.events_blacklist`;
let blacklist = {};

if (fs.existsSync(database)) {
    blacklist = JSON.parse(fs.readFileSync(database))
}

const EVENTS_SELECTOR = '[data-testid="event-item"] a';

const collectEvent = ({
    away_name,
    home_name,
    in_running,
    markets,
    scheduled_start_time,
}) => {
	return {
		date: new Date(scheduled_start_time),
		entity: {
			name: 'betwarrior',
			type: 'bookmaker'
		},
		isLive: in_running,
		markets: markets.map(({name, outcomes}) => ({
			name,
			selections: outcomes.map(({current_decimal_odds, name}) => ({
				name,
				odds: Number(current_decimal_odds)
			}))
		})),
		participants: home_name && away_name ? [home_name, away_name] : [],
		type: 'match',
	}
}

const forEachEvent = async (page, callback) => {
    await page.waitForSelector(EVENTS_SELECTOR, { timeout: TIMEOUT });

    const events = await page.evaluate(async (selector) => {
        const events = [];
        const eventsNodes = document.querySelectorAll(selector);

        for (const eventNode of eventsNodes) {
            events.push(eventNode.textContent.trim());
        }

        return Promise.resolve(events);
    }, EVENTS_SELECTOR);

    const visited = {};

    for (let i = 0; i < events.length; i++) {
        const currentEvent = normalize(events[i]);

        if (visited[currentEvent] || blacklist[currentEvent]) {
            continue;
        }

        try {
			await page.waitForSelector(EVENTS_SELECTOR, { timeout: TIMEOUT });

            await page.evaluate(async (selector, eventIndex) => {
                const eventsNodes = document.querySelectorAll(selector);
        
                eventsNodes.item(eventIndex).click();
            }, EVENTS_SELECTOR, i);

            const eventData = await waitAjaxResponse(page, 'sportsbook-api.shapegamesbw.com/api/events');
    
            await callback(eventData);
        }
        catch (error) {
            blacklist[currentEvent] = true

            console.log(`Failed to visit event "${currentEvent}"`, error);

            fs.writeFileSync(database, JSON.stringify(blacklist, null, 1));
        }
        finally {
			visited[currentEvent] = true
			
			await clickOnBreadcrumbItem(page, 3);
        }
	}
}

module.exports = {
	collectEvent,
    forEachEvent
}