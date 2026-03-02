const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
    createTeam,
    deleteTeam,
    startGame,
    endGame,
    updateDeckSize,
    getAllTeams,
    getLeaderboard,
} = require('../controllers/adminController');

/**
 * All admin routes require authentication + admin role.
 */
router.use(protect);
router.use(authorize('admin'));

router.post('/team', createTeam);
router.delete('/team/:teamId', deleteTeam);
router.post('/game/start', startGame);
router.post('/game/end', endGame);
router.put('/deck-size', updateDeckSize);
router.get('/teams', getAllTeams);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
