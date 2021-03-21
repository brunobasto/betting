# MVP Roadmap

## Core Product

### Scrappers

So the we have enough data for an MVP, we need finish the implementation of a few scrappers:
1. Betfair (**High Priority**)
2. Bet365 (**Low Priority**)
3. Pinnacle (**Low Priority**)

The above are incomplete because:
1. They do not output the new format of events that support multiple markets
2. They only scrape a couple of sports instead of scrapping it all
3. They do not send the `eventsBatch` event to allow computing a stream of events on the go

### Database

For the Proof of Concepet, all scrappers would return some data and we would use the data in memory to compute matches and opportunities. Now that the scrappers can take quite a while to finish, we need to be able to compute events as we receive them. To do that reliably we need to have a single source of thruth for the data and that will our database.

### Performance

Right now the Betano scrapper takes around 40 minutes to complete. That could be improved by computing a couple of sports in paralel (Divide and Conquer). Also we should try to leverage the Sinple Page Applications as much as possible to avoid slow page refreshes.

## Website

### Domain

### Design and Layout

### Authentication

### Payment