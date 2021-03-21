const mongoose = require('mongoose');
const { Entity } = require('../entities/model');

const EventSchema = new mongoose.Schema({
    // Indexes
    date: {
        required: true,
        type: Date,
        index: true,
    },
    entity: {
        type: mongoose.Types.ObjectId,
        required: true,
        index: true,
    },
    league: {
        type: String,
        required: true,
        index: true,
    },
    participants: {
        required: true,
        type: [String],
        index: true,
    },
    sport: {
        required: true,
        type: String,
        index: true,
    },
    // Other fields
    isLive: Boolean,
    markets: {
        type: Array,
        required: true
    },
    type: String,
});

EventSchema.index({
    date: 1,
    entity: 1,
    league: 1,
    participants: 1,
    sport: 1
}, { unique: true })

EventSchema.statics.fromRawData = async function (rawData) {
    const rawEntity = rawData.entity;
    const entity = await Entity.findOne({ name: rawEntity.name });

    return new Event({
        ...rawData,
        entity: entity._id
    })
}

const Event = mongoose.model('Event', EventSchema);

module.exports = {
    Event,
    EventSchema,
};