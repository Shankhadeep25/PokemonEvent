const express = require('express');
const router = express.Router();
const { signup, login } = require('../controllers/authController');

/**
 * Auth routes — public (no auth middleware).
 */
router.post('/signup', signup);
router.post('/login', login);

module.exports = router;
