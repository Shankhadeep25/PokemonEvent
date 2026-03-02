const Team = require('../models/Team');
const Pokemon = require('../models/Pokemon');
const GameState = require('../models/GameState');
const ErrorResponse = require('../utils/errorResponse');
const { catchPokemon } = require('../services/catchService');
const { assignRiddle } = require('../services/riddleService');
const { getIO } = require('../socket/socketHandler');

/**
 * Helper: fetch the singleton GameState and validate the game is running.
 */
const getActiveGameState = async () => {
    const gameState = await GameState.findOne();
    if (!gameState) throw new ErrorResponse('Game not initialized — run seed script', 500);
    if (!gameState.isStarted) throw new ErrorResponse('Game has not started yet', 403);
    if (gameState.isEnded) throw new ErrorResponse('Game has already ended', 403);
    return gameState;
};

/**
 * @route   GET /api/game/riddle
 * @desc    Request a riddle (10-min cooldown enforced)
 * @access  Participant
 */
const requestRiddle = async (req, res, next) => {
    try {
        await getActiveGameState();

        const { teamId } = req.user;
        if (!teamId) return next(new ErrorResponse('You are not part of a team', 400));

        const { riddle, alreadyActive } = await assignRiddle(teamId);

        res.status(200).json({
            success: true,
            alreadyActive,
            data: {
                riddleId: riddle._id,
                question: riddle.question,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/game/catch
 * @desc    Scan QR → validate → atomic catch
 * @access  Participant
 */
const catchPokemonHandler = async (req, res, next) => {
    try {
        const gameState = await getActiveGameState();

        const { teamId } = req.user;
        const { qrCodeValue } = req.body;

        if (!teamId) return next(new ErrorResponse('You are not part of a team', 400));
        if (!qrCodeValue) return next(new ErrorResponse('qrCodeValue is required', 400));

        const caught = await catchPokemon({ teamId, qrCodeValue, gameState });

        res.status(200).json({
            success: true,
            message: `${caught.name} caught successfully!`,
            data: { pokemonId: caught._id, name: caught.name },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/game/release
 * @desc    Release a Pokémon — only when deck is full
 * @access  Participant
 */
const releasePokemon = async (req, res, next) => {
    try {
        await getActiveGameState();

        const { teamId } = req.user;
        const { pokemonId } = req.body;

        if (!teamId) return next(new ErrorResponse('You are not part of a team', 400));
        if (!pokemonId) return next(new ErrorResponse('pokemonId is required', 400));

        const team = await Team.findOne({ teamId });
        if (!team) return next(new ErrorResponse('Team not found', 404));

        // Release button only active when deck is full
        const gameState = await GameState.findOne();
        const maxDeck = Math.min(team.maxAllowedPokemons, gameState.maxDeckSize);
        if (team.caughtPokemons.length < maxDeck) {
            return next(
                new ErrorResponse('Release is only allowed when your deck is full', 400)
            );
        }

        // Check the Pokémon belongs to this team
        if (!team.caughtPokemons.map(String).includes(String(pokemonId))) {
            return next(new ErrorResponse('This Pokémon is not in your deck', 400));
        }

        // Release the Pokémon — re-activate QR
        await Pokemon.findByIdAndUpdate(pokemonId, {
            isCaught: false,
            caughtByTeamId: null,
            isQrActive: true,
        });

        // Remove from team's deck
        await Team.findOneAndUpdate(
            { teamId },
            { $pull: { caughtPokemons: pokemonId } }
        );

        const pokemon = await Pokemon.findById(pokemonId);

        const io = getIO();
        io.to(teamId).emit('pokemonReleased', {
            pokemonId,
            pokemonName: pokemon?.name,
            message: `${pokemon?.name} has been released back into the wild!`,
        });

        res.status(200).json({
            success: true,
            message: `${pokemon?.name} released successfully`,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/game/team
 * @desc    Get own team status
 * @access  Participant
 */
const getTeamStatus = async (req, res, next) => {
    try {
        const { teamId } = req.user;
        if (!teamId) return next(new ErrorResponse('You are not part of a team', 400));

        const team = await Team.findOne({ teamId })
            .populate('members', 'name')
            .populate('caughtPokemons', 'name')
            .populate('activeRiddleId', 'question');

        if (!team) return next(new ErrorResponse('Team not found', 404));

        const gameState = await GameState.findOne();

        res.status(200).json({
            success: true,
            data: {
                teamId: team.teamId,
                status: team.status,
                members: team.members,
                caughtPokemons: team.caughtPokemons,
                activeRiddle: team.activeRiddleId,
                maxDeck: Math.min(team.maxAllowedPokemons, gameState?.maxDeckSize || 4),
                deckFull:
                    team.caughtPokemons.length >=
                    Math.min(team.maxAllowedPokemons, gameState?.maxDeckSize || 4),
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    requestRiddle,
    catchPokemonHandler,
    releasePokemon,
    getTeamStatus,
};
