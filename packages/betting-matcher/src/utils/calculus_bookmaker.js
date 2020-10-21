const calculateExactStakes = ({ backOdds, layOdds, maxStake }) => {
    const backStake = backStake = (layOdds * maxStake) / (backOdds + layOdds)
    const layStake = maxStake - layStake;

    return { backStake, layStake };
}

const calculateProfits = ({ backOdds, backStake, layOdds, layStake }) => {
    const backerAward = backStake * (backOdds - 1);
    const layerLoss = layStake;
    const backerProfit = backerAward - layerLoss;

    const layerAward = layStake * (layOdds - 1);
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

const calculateStakesBetweenBookmakers = ({ backOdds, layOdds, maxStake }) => {
    const { backStake, layStake } = calculateExactStakes({ backOdds, layOdds, maxStake })
    // const {backStake, layStake} = calculateRoundStakes({ backOdds, layOdds, maxStake })

    const profits = calculateProfits({ backOdds, backStake, layOdds, layStake })

    return {
        backStake,
        layStake,
        liability: backStake + layStake,
        ...profits
    }
}

module.exports = {
    calculateStakesBetweenBookmakers
};