const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
    {
        // Unique team identifier created by admin (e.g., "TEAM-ALPHA")
        teamId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        // Array of User ObjectIds — max 3 members enforced at registration
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        // Pokémon ObjectIds this team currently owns
        caughtPokemons: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Pokemon',
            },
        ],
        // The riddle currently assigned to this team (null if none)
        activeRiddleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Riddle',
            default: null,
        },
        // Timestamp of last riddle assignment — for 10-min cooldown
        lastRiddleAssignedAt: {
            type: Date,
            default: null,
        },
        // Per-team max deck size (starts at 4, admin can raise to 10)
        maxAllowedPokemons: {
            type: Number,
            default: 4,
            min: 4,
            max: 10,
        },
        status: {
            type: String,
            enum: ['active', 'eliminated'],
            default: 'active',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Team', teamSchema);
