const mongoose = require('mongoose');

/**
 * Singleton document — exactly one GameState document exists in the DB.
 * Created by the seed script.
 */
const gameStateSchema = new mongoose.Schema(
    {
        isStarted: {
            type: Boolean,
            default: false,
        },
        isEnded: {
            type: Boolean,
            default: false,
        },
        // Global max deck size — admin can increase from 4 to 10
        maxDeckSize: {
            type: Number,
            default: 4,
            min: 4,
            max: 10,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('GameState', gameStateSchema);
