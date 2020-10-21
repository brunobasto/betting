const getBetKey = ({backPlayer, layPlayer, date}) => {
    return `${backPlayer}_${layPlayer}_${date.toISOString()}`;
}

module.exports = {
    getBetKey
}