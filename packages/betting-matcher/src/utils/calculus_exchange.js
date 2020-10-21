function round(i, v = 5) {
    return Math.round(i / v) * v;
}

const calculateExactStakes = ({ backOdds, commission, layOdds, maxStake }) => {
    const backStake = (maxStake * (commission - layOdds)) / (backOdds * (-layOdds) + backOdds + commission - layOdds);
    const layStake = ((maxStake - backStake) / (layOdds - 1));

    return { backStake, layStake };
}

const calculateRoundStakes = ({ backOdds, commission, layOdds, maxStake }) => {
    let minDiff = {
        backStake: 0,
        layStake: 0,
        value: Infinity
    };

    for (let i = 0; i < maxStake; i++) {
        const backStake = round(i, 1);
        // const layStake = maxStake - backStake;
        const layStake = ((maxStake - backStake) / (layOdds - 1))

        const { layerProfit, backerProfit } = calculateProfits({
            backOdds,
            backStake,
            commission,
            layOdds,
            layStake
        })

        const diff = Math.abs(layerProfit - backerProfit);

        if (diff < minDiff.value) {
            minDiff.value = diff;
            minDiff.backStake = backStake;
            minDiff.layStake = layStake;
        }
    }

    return minDiff;
}

const calculateProfits = ({ backOdds, backStake, commission, layOdds, layStake }) => {
    const backerAward = backStake * (backOdds - 1);
    const layerLoss = layStake * (layOdds - 1);
    const backerProfit = backerAward - layerLoss;

    const layerAward = (layStake * (1 - commission));
    const backerLoss = backStake;
    const layerProfit = layerAward - backerLoss;

    return {
        backerAward,
        backerLoss,
        backerProfit,
        layerAward,
        layerLoss,
        layerProfit,
    };
}

const calculateStakesWithLayOnExchange = ({ backOdds, commission, layOdds, maxStake }) => {
    const { backStake, layStake } = calculateExactStakes({ backOdds, commission, layOdds, maxStake })
    // const {backStake, layStake} = calculateRoundStakes({ backOdds, commission, layOdds, maxStake })

    const profits = calculateProfits({ backOdds, backStake, commission, layOdds, layStake })

    return {
        backStake,
        layStake,
        liability: backStake + profits.layerLoss,
        ...profits
    }
}

module.exports = {
    calculateStakesWithLayOnExchange
};