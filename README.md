# 🎮 Pokémon Hunt — Real-Time College Event Backend

A scalable, real-time backend for a **QR-based Pokémon treasure hunt** college event. Teams compete to solve riddles, find physical QR codes, and catch Pokémon — all managed through a secure, event-driven API.

---

## ⚡ Tech Stack

| Layer          | Technology                         |
|----------------|------------------------------------|
| Runtime        | Node.js                            |
| Framework      | Express.js 5                       |
| Database       | MongoDB + Mongoose 9               |
| Auth           | JWT (jsonwebtoken) + bcryptjs      |
| Real-Time      | Socket.io                          |
| QR Generation  | qrcode (for printable PNGs)        |

---

## 📁 Project Structure

```
Poke/
├── server.js                   # Entry point — Express + Socket.io + MongoDB
├── .env                        # Environment variables
├── package.json
│
├── scripts/
│   ├── seed.js                 # Seeds 100 Pokémon, riddles & game state
│   └── generateQR.js           # Generates printable QR code PNGs
│
├── qr-codes/                   # Generated QR images (one per Pokémon)
│   ├── Pikachu.png
│   ├── Charizard.png
│   ├── ...                     # 100 PNGs total
│   └── qr-mapping.json         # Name → UUID mapping
│
└── src/
    ├── config/
    │   └── db.js               # MongoDB connection
    │
    ├── models/
    │   ├── User.js             # User/account schema
    │   ├── Team.js             # Team schema (caught Pokémon, members)
    │   ├── Pokemon.js          # Pokémon schema (name, QR, catch status)
    │   ├── Riddle.js           # Riddle schema (linked to Pokémon)
    │   └── GameState.js        # Singleton game config (started/ended, deck size)
    │
    ├── controllers/
    │   ├── authController.js   # Register & login logic
    │   ├── adminController.js  # Team/game management
    │   └── gameController.js   # Riddle & catch logic
    │
    ├── services/
    │   ├── catchService.js     # Atomic Pokémon catching (transaction-safe)
    │   └── riddleService.js    # Riddle assignment logic
    │
    ├── middleware/
    │   ├── auth.js             # JWT verification (protect)
    │   ├── role.js             # Role-based access (authorize)
    │   └── errorHandler.js     # Centralized error handler
    │
    ├── routes/
    │   ├── authRoutes.js       # /api/auth/*
    │   ├── adminRoutes.js      # /api/admin/*
    │   └── gameRoutes.js       # /api/game/*
    │
    ├── socket/
    │   └── socketHandler.js    # Socket.io event handlers
    │
    └── utils/
        └── errorResponse.js    # Custom error class
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB** running locally or a MongoDB Atlas connection string

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file (or edit the existing one):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/PokemonEvent
JWT_SECRET=your_super_secret_jwt_key_change_in_production
```

### 3. Generate QR Codes

```bash
node scripts/generateQR.js
```

This creates **100 printable QR code PNGs** in `qr-codes/` and a `qr-mapping.json` for UUID synchronization.

### 4. Seed the Database

```bash
npm run seed
```

Seeds 100 Pokémon with riddles and creates the game state. UUIDs are pulled from `qr-mapping.json` so the database matches your printed QR codes.

### 5. Start the Server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server runs at `http://localhost:5000`.

---

## 📡 API Routes

### 🔓 Auth — `/api/auth` (Public)

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| POST   | `/api/auth/register`  | Register a new user            |
| POST   | `/api/auth/login`     | Login & receive JWT token      |

### 🛡️ Admin — `/api/admin` (Admin only)

| Method | Endpoint                    | Description                  |
|--------|-----------------------------|------------------------------|
| POST   | `/api/admin/team`           | Create a new team            |
| DELETE | `/api/admin/team/:teamId`   | Delete a team                |
| POST   | `/api/admin/game/start`     | Start the game               |
| POST   | `/api/admin/game/end`       | End the game                 |
| PUT    | `/api/admin/deck-size`      | Update max deck size         |
| GET    | `/api/admin/teams`          | Get all teams                |
| GET    | `/api/admin/leaderboard`    | Get the leaderboard          |

### 🎮 Game — `/api/game` (Participants only)

| Method | Endpoint            | Description                         |
|--------|---------------------|-------------------------------------|
| GET    | `/api/game/riddle`  | Get current riddle for your team    |
| POST   | `/api/game/catch`   | Catch a Pokémon via QR code scan    |
| POST   | `/api/game/release` | Release a caught Pokémon            |
| GET    | `/api/game/team`    | Get your team's status & Pokémon    |

### 🏥 Health Check

| Method | Endpoint | Description          |
|--------|----------|----------------------|
| GET    | `/`      | API status check     |

---

## 🎯 Game Rules

- **100 unique Pokémon**, each with a physical QR code hidden on campus
- **Max 25 teams**, each can catch up to **4 Pokémon** (configurable deck size)
- Each Pokémon can only be caught by **one team** (unique ownership)
- QR codes **deactivate after use** — no double catches
- Teams receive **riddles** to find their next Pokémon
- Catching is **transaction-safe** — no race conditions
- Admin controls game **start/end** in real-time

---

## 🔌 Real-Time Events (Socket.io)

The server broadcasts live events via Socket.io:

| Event              | Description                              |
|--------------------|------------------------------------------|
| `pokemon:caught`   | A Pokémon was caught by a team           |
| `game:started`     | Admin started the game                   |
| `game:ended`       | Admin ended the game                     |
| `leaderboard:update` | Leaderboard changed                   |

---

## 🔐 Authentication Flow

1. **Register** → `POST /api/auth/register` (returns JWT)
2. **Login** → `POST /api/auth/login` (returns JWT)
3. Include token in all protected requests:
   ```
   Authorization: Bearer <your_jwt_token>
   ```

---

## 🖨️ Printing QR Codes

After running `node scripts/generateQR.js`:

1. Navigate to the `qr-codes/` folder
2. Each PNG is **400×400px** with **high error correction** (scannable even if partially damaged)
3. Print and place them at locations around campus
4. The filename matches the Pokémon name (e.g., `Pikachu.png`)

---

## 📜 Available Scripts

| Script                          | Description                         |
|---------------------------------|-------------------------------------|
| `npm start`                     | Start production server             |
| `npm run dev`                   | Start dev server with hot-reload    |
| `npm run seed`                  | Seed database with Pokémon & riddles|
| `node scripts/generateQR.js`   | Generate printable QR code images   |

---

## 📝 License

ISC
