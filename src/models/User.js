const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        // Each participant must provide a teamId created by admin
        teamId: {
            type: String,
            default: null,
        },
        role: {
            type: String,
            enum: ['admin', 'participant'],
            default: 'participant',
        },
    },
    { timestamps: true }
);

// Unique constraint: no two members with the same name in the same team
userSchema.index({ teamId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
