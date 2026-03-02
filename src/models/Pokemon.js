const mongoose = require('mongoose');

const pokemonSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        // A unique UUID that is printed / shown as QR code
        qrCodeValue: {
            type: String,
            required: true,
            unique: true,
        },
        // Becomes true atomically when a team catches this Pokémon
        isCaught: {
            type: Boolean,
            default: false,
        },
        // Null when uncaught; set atomically during catch
        caughtByTeamId: {
            type: String,
            default: null,
        },
        // QR is deactivated immediately after a successful catch
        isQrActive: {
            type: Boolean,
            default: true,
        },
        // Reference to the riddle whose answer is this Pokémon
        riddleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Riddle',
        },
    },
    { timestamps: true }
);

// ---------- COMPOUND INDEX for the atomic catch query ----------
// Ensures fast lookups for: { _id, isCaught: false, isQrActive: true }
pokemonSchema.index({ isCaught: 1, isQrActive: 1 });

module.exports = mongoose.model('Pokemon', pokemonSchema);
