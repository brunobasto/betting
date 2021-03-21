const mongoose = require('mongoose');
const { Event, EventSchema } = require('./events/model');
const { Entity, ENTITY_TYPES } = require('./entities/model');

const connect = async () => {
    const client = await mongoose.connect(
        'mongodb://localhost/betting',
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
    );

    return client;
}

module.exports = {
    connect,
    Entity,
    Event,
    EventSchema,
}