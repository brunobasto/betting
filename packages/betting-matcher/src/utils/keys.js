const getEventKey = ({backPlayer, layPlayer, date}) => {
    return `${backPlayer}_${layPlayer}}`;
}

module.exports = {
    getEventKey
}