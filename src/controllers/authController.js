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
 * @route   POST /api/auth/signup
 * @desc    Sign up a participant with teamId + name
 * @access  Public
 */
const signup = async (req, res, next) => {
    try {
        const { name, teamId } = req.body;

        if (!name || !teamId) {
            return next(new ErrorResponse('name and teamId are required', 400));
        }

        // ── Validate the team exists ──
        const team = await Team.findOne({ teamId });
        if (!team) {
            return next(new ErrorResponse('Invalid teamId — ask admin to create one', 404));
        }
        if (team.members.length >= 3) {
            return next(new ErrorResponse('Team already has 3 members', 400));
        }

        // ── Check duplicate name within the same team ──
        const existingUser = await User.findOne({ name, teamId });
        if (existingUser) {
            return next(new ErrorResponse('Name already taken in this team', 400));
        }

        // ── Create participant user ──
        const user = await User.create({
            name,
            teamId,
            role: 'participant',
        });

        // ── Push user into team.members ──
        team.members.push(user._id);
        await team.save();

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
 * @desc    Login — participants use name+teamId, admin uses name+adminSecret
 * @access  Public
 */
const login = async (req, res, next) => {
    try {
        const { name, teamId, adminSecret } = req.body;

        if (!name) {
            return next(new ErrorResponse('Please provide your name', 400));
        }

        let user;

        if (adminSecret) {
            // ── Admin login: verify secret key ──
            if (adminSecret !== process.env.ADMIN_SECRET) {
                return next(new ErrorResponse('Invalid admin secret', 401));
            }
            user = await User.findOne({ name, role: 'admin' });
        } else {
            // ── Participant login: look up by name + teamId ──
            if (!teamId) {
                return next(new ErrorResponse('Please provide your teamId', 400));
            }
            user = await User.findOne({ name, teamId });
        }

        if (!user) {
            return next(new ErrorResponse('Invalid credentials — user not found', 401));
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

module.exports = { signup, login };
