const DRAW_LIST = ['SOCCER'];

const canDraw = (sport) => {
    return DRAW_LIST.includes(sport);
}

module.exports = {
    canDraw
}