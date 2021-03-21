const mongoose = require('mongoose');

const ENTITY_TYPES = {
    BOOKMAKER: 'bookmaker',
    EXCHANGE: 'exchange,'
};

const EntitySchema = new mongoose.Schema({
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

const Entity = mongoose.model('Entity', EntitySchema);

module.exports = {
    Entity,
    ENTITY_TYPES,
};