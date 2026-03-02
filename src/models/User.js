const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 4,
            select: false, // never return password by default
        },
        role: {
            type: String,
            enum: ['admin', 'participant'],
            default: 'participant',
        },
    },
    { timestamps: true }
);

// ---------- Pre-save hook: hash password ----------
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// ---------- Instance method: compare passwords ----------
userSchema.methods.matchPassword = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
