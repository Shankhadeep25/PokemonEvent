const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Team = require('../models/Team');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Generate a JWT containing user id, role, and teamId.
 */
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role, teamId: user.teamId },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a participant (or admin if secret provided)
 * @access  Public
 */
const register = async (req, res, next) => {
    try {
        const { name, password, teamId, adminSecret } = req.body;

        // ── Admin registration (optional, via a secret key) ──
        let role = 'participant';
        if (adminSecret && adminSecret === process.env.JWT_SECRET) {
            role = 'admin';
        }

        // ── Participant must provide a valid teamId ──
        let team = null;
        if (role === 'participant') {
            if (!teamId) {
                return next(new ErrorResponse('teamId is required for participants', 400));
            }
            team = await Team.findOne({ teamId });
            if (!team) {
                return next(new ErrorResponse('Invalid teamId — ask admin to create one', 404));
            }
            if (team.members.length >= 3) {
                return next(new ErrorResponse('Team already has 3 members', 400));
            }
        }

        // ── Check duplicate name ──
        const existingUser = await User.findOne({ name });
        if (existingUser) {
            return next(new ErrorResponse('Name already taken', 400));
        }

        // ── Create user ──
        const user = await User.create({
            name,
            password,
            teamId: role === 'participant' ? teamId : null,
            role,
        });

        // ── Push user into team.members ──
        if (team) {
            team.members.push(user._id);
            await team.save();
        }

        const token = generateToken(user);

        res.status(201).json({
            success: true,
            token,
            user: { id: user._id, name: user.name, role: user.role, teamId: user.teamId },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login and receive JWT
 * @access  Public
 */
const login = async (req, res, next) => {
    try {
        const { name, password } = req.body;

        if (!name || !password) {
            return next(new ErrorResponse('Please provide name and password', 400));
        }

        const user = await User.findOne({ name }).select('+password');
        if (!user) {
            return next(new ErrorResponse('Invalid credentials', 401));
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return next(new ErrorResponse('Invalid credentials', 401));
        }

        const token = generateToken(user);

        res.status(200).json({
            success: true,
            token,
            user: { id: user._id, name: user.name, role: user.role, teamId: user.teamId },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login };
