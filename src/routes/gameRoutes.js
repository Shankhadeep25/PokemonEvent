const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
    requestRiddle,
    catchPokemonHandler,
    releasePokemon,
    getTeamStatus,
} = require('../controllers/gameController');

/**
 * All game routes require authentication + participant role.
 */
router.use(protect);
router.use(authorize('participant'));

router.get('/riddle', requestRiddle);
router.post('/catch', catchPokemonHandler);
router.post('/release', releasePokemon);
router.get('/team', getTeamStatus);

module.exports = router;
