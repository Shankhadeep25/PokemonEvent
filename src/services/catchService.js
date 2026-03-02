const mongoose = require('mongoose');
const Pokemon = require('../models/Pokemon');
const Team = require('../models/Team');
const Riddle = require('../models/Riddle');
const ErrorResponse = require('../utils/errorResponse');
const { getIO } = require('../socket/socketHandler');

/**
 * CRITICAL CATCH LOGIC
 *
 * 1. Validate game is running.
 * 2. Validate the scanned QR matches the Pokémon linked to team's active riddle.
 * 3. Atomically update the Pokémon document (isCaught=false → true).
 * 4. Inside a transaction, push pokemonId into team.caughtPokemons & clear activeRiddleId.
 * 5. Emit Socket.io events (pokemonCaught / riddleInvalidated / pokemonAlreadyCaught).
 */
const catchPokemon = async ({ teamId, qrCodeValue, gameState }) => {
    const io = getIO();

    // ── 1. Fetch the team ──
    const team = await Team.findOne({ teamId });
    if (!team) throw new ErrorResponse('Team not found', 404);
    if (team.status !== 'active') throw new ErrorResponse('Team is eliminated', 403);

    // ── 2. Check deck capacity ──
    const maxDeck = Math.min(team.maxAllowedPokemons, gameState.maxDeckSize);
    if (team.caughtPokemons.length >= maxDeck) {
        throw new ErrorResponse('Deck is full — release a Pokémon first', 400);
    }

    // ── 3. Team must have an active riddle ──
    if (!team.activeRiddleId) {
        throw new ErrorResponse('No active riddle — request one first', 400);
    }

    const riddle = await Riddle.findById(team.activeRiddleId);
    if (!riddle) throw new ErrorResponse('Riddle not found', 404);

    // ── 4. Find the answer Pokémon and verify QR matches ──
    const pokemon = await Pokemon.findById(riddle.answerPokemonId);
    if (!pokemon) throw new ErrorResponse('Pokémon not found', 404);

    if (pokemon.qrCodeValue !== qrCodeValue) {
        throw new ErrorResponse('QR code does not match your active riddle', 400);
    }

    // ── 5. ATOMIC catch: only succeeds if isCaught is still false & QR active ──
    const caught = await Pokemon.findOneAndUpdate(
        { _id: pokemon._id, isCaught: false, isQrActive: true },
        { isCaught: true, caughtByTeamId: teamId, isQrActive: false },
        { new: true }
    );

    // If null → another team beat us to it
    if (!caught) {
        io.to(teamId).emit('pokemonAlreadyCaught', {
            message: `${pokemon.name} was already caught or QR is inactive`,
            pokemonName: pokemon.name,
        });
        throw new ErrorResponse('Pokémon already caught or QR inactive', 409);
    }

    // ── 6. Transaction: update team document ──
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        await Team.findOneAndUpdate(
            { teamId },
            {
                $push: { caughtPokemons: pokemon._id },
                $set: { activeRiddleId: null },
            },
            { session }
        );
        await session.commitTransaction();
    } catch (err) {
        await session.abortTransaction();
        // Rollback the Pokémon catch
        await Pokemon.findByIdAndUpdate(pokemon._id, {
            isCaught: false,
            caughtByTeamId: null,
            isQrActive: true,
        });
        throw new ErrorResponse('Transaction failed — catch rolled back', 500);
    } finally {
        session.endSession();
    }

    // ── 7. Emit success event to all clients ──
    io.emit('pokemonCaught', {
        teamId,
        pokemonName: caught.name,
        pokemonId: caught._id,
    });

    // ── 8. Invalidate riddle for other teams that had the same riddle ──
    const affectedTeams = await Team.find({
        activeRiddleId: riddle._id,
        teamId: { $ne: teamId },
    });

    for (const t of affectedTeams) {
        // Clear their active riddle so they can request a new one immediately
        await Team.findOneAndUpdate(
            { teamId: t.teamId },
            { $set: { activeRiddleId: null, lastRiddleAssignedAt: null } }
        );

        io.to(t.teamId).emit('riddleInvalidated', {
            message: `The Pokémon for your riddle was caught by another team. Request a new riddle.`,
            pokemonName: caught.name,
        });
    }

    return caught;
};

module.exports = { catchPokemon };
