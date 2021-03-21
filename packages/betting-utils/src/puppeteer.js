const waitAjaxResponse = (page, urlPattern = '') => {
    return new Promise((resolve, reject) => {
        let resolved = false;
        let rejected = false;

        const handler = async (response) => {
            const request = response.request();
            const method = request.method();
            const url = response.url();

            if (!rejected && method === 'GET' && url.includes(urlPattern)) {
                try {
                    const body = await response.json();
    
                    page.removeListener('response', handler);

                    resolved = true;
                    resolve(body);
                }
                catch (error) {
                    rejected = true;
                    reject(error);
                }
            }
        };

        setTimeout(() => {
            if (!resolved) {
                rejected = true;
                reject('Ajax response timed out.');
            }
        }, 10000);
    
        page.on('response', handler);
    });
}

module.exports = {
    waitAjaxResponse
}