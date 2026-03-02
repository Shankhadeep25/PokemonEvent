const mongoose = require('mongoose');

const riddleSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: true,
        },
        // The Pokémon that is the answer to this riddle
        answerPokemonId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Pokemon',
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Riddle', riddleSchema);
