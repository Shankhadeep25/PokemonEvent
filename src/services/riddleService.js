const Team = require('../models/Team');
const Riddle = require('../models/Riddle');
const Pokemon = require('../models/Pokemon');
const ErrorResponse = require('../utils/errorResponse');

const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Assign a random riddle to the team.
 *
 * Rules:
 * - Team must not already have an active riddle.
 * - 10-minute cooldown between riddle requests.
 * - Picks a random riddle whose answer Pokémon is still uncaught.
 */
const assignRiddle = async (teamId) => {
    const team = await Team.findOne({ teamId });
    if (!team) throw new ErrorResponse('Team not found', 404);
    if (team.status !== 'active') throw new ErrorResponse('Team is eliminated', 403);

    // If team already has an active riddle, return it
    if (team.activeRiddleId) {
        const existingRiddle = await Riddle.findById(team.activeRiddleId);
        if (existingRiddle) {
            return { riddle: existingRiddle, alreadyActive: true };
        }
    }

    // Enforce 10-minute cooldown
    if (team.lastRiddleAssignedAt) {
        const elapsed = Date.now() - new Date(team.lastRiddleAssignedAt).getTime();
        if (elapsed < COOLDOWN_MS) {
            const remainingSec = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
            throw new ErrorResponse(
                `Cooldown active — wait ${remainingSec} seconds before requesting a new riddle`,
                429
            );
        }
    }

    // Find all uncaught Pokémon IDs
    const uncaughtPokemons = await Pokemon.find({ isCaught: false }).select('_id');
    if (uncaughtPokemons.length === 0) {
        throw new ErrorResponse('No uncaught Pokémon available', 404);
    }

    const uncaughtIds = uncaughtPokemons.map((p) => p._id);

    // Find riddles whose answer Pokémon is uncaught and riddle is active
    const availableRiddles = await Riddle.find({
        answerPokemonId: { $in: uncaughtIds },
        isActive: true,
    });

    if (availableRiddles.length === 0) {
        throw new ErrorResponse('No available riddles at this time', 404);
    }

    // Pick random riddle
    const randomRiddle =
        availableRiddles[Math.floor(Math.random() * availableRiddles.length)];

    // Update team with new riddle
    await Team.findOneAndUpdate(
        { teamId },
        {
            activeRiddleId: randomRiddle._id,
            lastRiddleAssignedAt: new Date(),
        }
    );

    return { riddle: randomRiddle, alreadyActive: false };
};

module.exports = { assignRiddle };
