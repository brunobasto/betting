const mongoose = require('mongoose');

const ENTITY_TYPES = {
    BOOKMAKER: 'bookmaker',
    EXCHANGE: 'exchange,'
};

const MarketSchema = new mongoose.Schema({
    name: {
        index: true,
        required: true,
        type: String,
        unique: true,
    },
    type: {
        enum: [ENTITY_TYPES.BOOKMAKER, ENTITY_TYPES.EXCHANGE],
        type: String,
        required: true,
    },
});

const Market = mongoose.model('Market', MarketSchema);

module.exports = {
    Market,
    ENTITY_TYPES,
};