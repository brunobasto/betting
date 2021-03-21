const BREADCRUMB_ITEMS_SELECTOR = '[class^="NavigationBreadcrumbs"] li a';

const clickOnBreadcrumbItem = async (page, index) => {
    await page.evaluate(async (selector, index) => {
        const leaguesNodes = document.querySelectorAll(selector);

        leaguesNodes.item(index).click();
    }, BREADCRUMB_ITEMS_SELECTOR, index);
}

module.exports = {
    clickOnBreadcrumbItem
}