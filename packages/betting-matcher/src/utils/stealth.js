function round(i, v = 5) {
    return Math.round(i / v) * v;
}

const calculateStealthStake = ({ layOdds, maxStake, ...others }, profitFunction) => {
    let minDiff = {
        backStake: 0,
        layStake: 0,
        value: Infinity
    };

    for (let i = 0; i < maxStake; i++) {
        const backStake = round(i, 1);
        // const layStake = maxStake - backStake;
        const layStake = ((maxStake - backStake) / (layOdds - 1))

        const { exchangeProfit, bookmakerProfit } = profitFunction({
            backStake,
            layOdds,
            layStake,
            ...others
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

module.exports = {
    calculateStealthStake
}
