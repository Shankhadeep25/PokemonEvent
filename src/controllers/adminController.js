const Team = require('../models/Team');
const Pokemon = require('../models/Pokemon');
const GameState = require('../models/GameState');
const ErrorResponse = require('../utils/errorResponse');
const { getIO } = require('../socket/socketHandler');

/**
 * @route   POST /api/admin/team
 * @desc    Create a new teamId
 * @access  Admin
 */
const createTeam = async (req, res, next) => {
    try {
        const { teamId } = req.body;
        if (!teamId) return next(new ErrorResponse('teamId is required', 400));

        const exists = await Team.findOne({ teamId });
        if (exists) return next(new ErrorResponse('Team ID already exists', 400));

        const team = await Team.create({ teamId });

        res.status(201).json({ success: true, data: team });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   DELETE /api/admin/team/:teamId
 * @desc    Delete a team and release all its Pokémon
 * @access  Admin
 */
const deleteTeam = async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const team = await Team.findOne({ teamId });
        if (!team) return next(new ErrorResponse('Team not found', 404));

        // Release all Pokémon owned by this team
        await Pokemon.updateMany(
            { caughtByTeamId: teamId },
            { isCaught: false, caughtByTeamId: null, isQrActive: true }
        );

        await Team.deleteOne({ teamId });

        const io = getIO();
        io.emit('teamDeleted', { teamId });

        res.status(200).json({ success: true, message: `Team ${teamId} deleted` });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/admin/game/start
 * @desc    Start the game
 * @access  Admin
 */
const startGame = async (req, res, next) => {
    try {
        const gameState = await GameState.findOneAndUpdate(
            {},
            { isStarted: true, isEnded: false },
            { new: true }
        );

        const io = getIO();
        io.emit('gameStarted', { message: 'The Pokémon Hunt has begun!' });

        res.status(200).json({ success: true, data: gameState });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/admin/game/end
 * @desc    End the game
 * @access  Admin
 */
const endGame = async (req, res, next) => {
    try {
        const gameState = await GameState.findOneAndUpdate(
            {},
            { isEnded: true },
            { new: true }
        );

        const io = getIO();
        io.emit('gameEnded', { message: 'The Pokémon Hunt has ended!' });

        res.status(200).json({ success: true, data: gameState });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PUT /api/admin/deck-size
 * @desc    Increase global max deck size (4–10)
 * @access  Admin
 */
const updateDeckSize = async (req, res, next) => {
    try {
        const { maxDeckSize } = req.body;
        if (!maxDeckSize || maxDeckSize < 4 || maxDeckSize > 10) {
            return next(new ErrorResponse('maxDeckSize must be between 4 and 10', 400));
        }

        const gameState = await GameState.findOneAndUpdate(
            {},
            { maxDeckSize },
            { new: true }
        );

        // Also update all teams' maxAllowedPokemons
        await Team.updateMany({}, { maxAllowedPokemons: maxDeckSize });

        const io = getIO();
        io.emit('deckSizeUpdated', { maxDeckSize });

        res.status(200).json({ success: true, data: gameState });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/admin/teams
 * @desc    List all teams with member count and caught count
 * @access  Admin
 */
const getAllTeams = async (req, res, next) => {
    try {
        const teams = await Team.find()
            .populate('members', 'name')
            .populate('caughtPokemons', 'name');

        res.status(200).json({ success: true, count: teams.length, data: teams });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/admin/leaderboard
 * @desc    Get leaderboard sorted by number of caught Pokémon
 * @access  Admin
 */
const getLeaderboard = async (req, res, next) => {
    try {
        const teams = await Team.find({ status: 'active' })
            .populate('caughtPokemons', 'name')
            .sort('-caughtPokemons');

        // Sort by caughtPokemons array length descending
        const sorted = teams.sort(
            (a, b) => b.caughtPokemons.length - a.caughtPokemons.length
        );

        const leaderboard = sorted.map((t, i) => ({
            rank: i + 1,
            teamId: t.teamId,
            caughtCount: t.caughtPokemons.length,
            pokemons: t.caughtPokemons.map((p) => p.name),
        }));

        res.status(200).json({ success: true, data: leaderboard });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTeam,
    deleteTeam,
    startGame,
    endGame,
    updateDeckSize,
    getAllTeams,
    getLeaderboard,
};
