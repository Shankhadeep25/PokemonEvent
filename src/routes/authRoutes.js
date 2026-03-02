const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

/**
 * Auth routes — public (no auth middleware).
 */
router.post('/register', register);
router.post('/login', login);

module.exports = router;
