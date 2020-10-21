function round(i, v = 5) {
    return Math.round(i / v) * v;
}

const calculateBackStake = ({ backOdds, commission, layOdds, maxStake }) => {
    // Calculated by making profit equations equal

    return (maxStake * (commission - 2 * layOdds + 2)) / (commission - 2 * layOdds - backOdds + 2);
}


const calculateRoundStakes = ({ backOdds, commission, layOdds, maxStake }) => {
    let minDiff = {
        backStake: 0,
        layStake: 0,
        value: Infinity
    };

    for (let i = 0; i < maxStake; i++) {
        const backStake = round(i, 5);
        // const layStake = maxStake - backStake;
        const layStake = ((maxStake - backStake) / (layOdds - 1))

        const { exchangeProfit, bookmakerProfit } = calculateProfits({
            backOdds,
            backStake,
            commission,
            layOdds,
            layStake
        })

        const diff = Math.abs(exchangeProfit - bookmakerProfit);

        if (diff < minDiff.value) {
            minDiff.value = diff;
            minDiff.backStake = backStake;
            minDiff.layStake = layStake;
        }
    }

    return minDiff;
}

const calculateProfits = ({ backOdds, backStake, commission, layOdds, layStake }) => {
    const bookmakerAward = backStake * (backOdds - 1);
    const exchangeLoss = layStake * (layOdds - 1);
    const bookmakerProfit = bookmakerAward - exchangeLoss;

    const exchangeAward = (layStake * (layOdds - 1 - commission));
    const bookmakerLoss = backStake;
    const exchangeProfit = exchangeAward - bookmakerLoss;

    return { exchangeProfit, bookmakerProfit };
}

const calculateStakes = ({ backOdds, commission, layOdds, maxStake }) => {
    // Calculated by making profit equations equal
    // const backStake = (maxStake * (commission - 2 * layOdds + 2)) / (commission - 2 * layOdds - backOdds + 2);
    // const layStake = maxStake - backStake;

    // const backStake = (maxStake * (commission - 2 * layOdds + 2)) / (backOdds * (-layOdds) + backOdds + commission - 2 * layOdds + 2)
    // const layStake = ((maxStake - backStake) / (layOdds - 1))

    const {backStake, layStake} = calculateRoundStakes({ backOdds, commission, layOdds, maxStake })

    const bookmakerAward = backStake * (backOdds - 1);
    const exchangeLoss = layStake * (layOdds - 1);
    const bookmakerProfit = bookmakerAward - exchangeLoss;

    const exchangeAward = (layStake * (layOdds - 1 - commission));
    const bookmakerLoss = backStake;
    const exchangeProfit = exchangeAward - bookmakerLoss;

    return {
        backStake,
        bookmakerAward,
        bookmakerLoss,
        bookmakerProfit,
        exchangeAward,
        exchangeLoss,
        exchangeProfit,
        layStake,
        liability: backStake + exchangeLoss,
    }
}

module.exports = {
    calculateStakes
};