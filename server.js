/**
 * ====================================================
 *  POKÉMON HUNT — Server Entry Point
 * ====================================================
 *
 * Starts Express + HTTP server, attaches Socket.io,
 * connects MongoDB, and registers all routes.
 */

require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/socket/socketHandler');
const errorHandler = require('./src/middleware/errorHandler');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const gameRoutes = require('./src/routes/gameRoutes');

const app = express();

// ── Core middleware ──
app.use(cors());
app.use(express.json());

// ── Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/game', gameRoutes);

// ── Health check ──
app.get('/', (req, res) => {
    res.json({ success: true, message: 'Pokémon Hunt API is running 🎮' });
});

// ── Global error handler (must be after routes) ──
app.use(errorHandler);

// ── Create HTTP server & attach Socket.io ──
const server = http.createServer(app);
initSocket(server);

// ── Connect DB & start listening ──
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`\n🚀 Server running on port ${PORT}`);
        console.log(`📡 Socket.io attached`);
        console.log(`🔗 http://localhost:${PORT}\n`);
    });
});
