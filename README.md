# 🎮 Pokémon Hunt — Real-Time College Event Backend

A scalable, real-time backend for a **QR-based Pokémon treasure hunt** college event. Teams compete to solve riddles, find physical QR codes, and catch Pokémon — all managed through a secure, event-driven API.

---

## ⚡ Tech Stack

| Layer          | Technology                         |
|----------------|-----------------------------------|
| Runtime        | Node.js                            |
| Framework      | Express.js 5                       |
| Database       | MongoDB + Mongoose 9               |
| Auth           | JWT (jsonwebtoken)                  |
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
│   ├── seed.js                 # Seeds 100 Pokémon, riddles, game state & admin user
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
    │   ├── User.js             # User schema (name, teamId, role)
    │   ├── Team.js             # Team schema (members, caught Pokémon)
    │   ├── Pokemon.js          # Pokémon schema (name, QR, catch status)
    │   ├── Riddle.js           # Riddle schema (linked to Pokémon)
    │   └── GameState.js        # Singleton game config (started/ended, deck size)
    │
    ├── controllers/
    │   ├── authController.js   # Signup & login logic (no passwords)
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
    │   └── socketHandler.js    # Socket.io setup + JWT auth for WebSockets
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
ADMIN_SECRET=pick_a_secret_for_admin_login
ADMIN_NAME=Admin
```

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | Signs JWT tokens |
| `ADMIN_SECRET` | Required for admin login verification |
| `ADMIN_NAME` | Name of the seeded admin user (default: `Admin`) |

### 3. Generate QR Codes

```bash
node scripts/generateQR.js
```

Creates **100 printable QR code PNGs** in `qr-codes/` and a `qr-mapping.json` for UUID synchronization.

### 4. Seed the Database

```bash
npm run seed
```

Seeds 100 Pokémon with riddles, creates the GameState, and creates the **admin user**. UUIDs are pulled from `qr-mapping.json` so the database matches your printed QR codes.

### 5. Start the Server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server runs at `http://localhost:5000`.

---

## 🔐 Authentication

**No passwords** — authentication is simplified for a college event.

- **Participants** sign up and log in with `{ name, teamId }`
- **Admin** is pre-seeded via `npm run seed` and logs in with `{ name, adminSecret }`
- Both receive a **JWT token** valid for 24 hours
- Include token in all protected requests:
  ```
  Authorization: Bearer <your_jwt_token>
  ```

### How It Works

| Who | Signup | Login |
|-----|--------|-------|
| **Admin** | Created by seed script | `{ "name": "Admin", "adminSecret": "your-secret" }` |
| **Participant** | `{ "name": "Alice", "teamId": "TEAM-ALPHA" }` | `{ "name": "Alice", "teamId": "TEAM-ALPHA" }` |

> The same `/api/auth/login` route handles both — the backend detects admin vs participant based on which fields are provided.

---

## 📡 API Routes

### 🔓 Auth — `/api/auth` (Public)

| Method | Endpoint            | Body | Description |
|--------|---------------------|------|-------------|
| POST   | `/api/auth/signup`  | `{ name, teamId }` | Participant signup (3 per team) |
| POST   | `/api/auth/login`   | `{ name, teamId }` or `{ name, adminSecret }` | Login & receive JWT |

### 🛡️ Admin — `/api/admin` (JWT + admin role)

| Method | Endpoint                    | Body | Description |
|--------|-----------------------------|------|-------------|
| POST   | `/api/admin/team`           | `{ teamId }` | Create a new team |
| DELETE | `/api/admin/team/:teamId`   | — | Delete a team & release its Pokémon |
| POST   | `/api/admin/game/start`     | — | Start the game |
| POST   | `/api/admin/game/end`       | — | End the game |
| PUT    | `/api/admin/deck-size`      | `{ maxDeckSize }` | Update max deck size (4–10) |
| GET    | `/api/admin/teams`          | — | List all teams with members & Pokémon |
| GET    | `/api/admin/leaderboard`    | — | Get ranked leaderboard |

### 🎮 Game — `/api/game` (JWT + participant role)

| Method | Endpoint            | Body | Description |
|--------|---------------------|------|-------------|
| GET    | `/api/game/riddle`  | — | Request a riddle (10-min cooldown) |
| POST   | `/api/game/catch`   | `{ qrCodeValue }` | Scan QR → catch Pokémon |
| POST   | `/api/game/release` | `{ pokemonId }` | Release a Pokémon (only when deck full) |
| GET    | `/api/game/team`    | — | Get own team status & deck |

### 🏥 Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/`      | API status check |

---

## 🔌 Real-Time Events (Socket.io)

Connect with JWT authentication:
```javascript
const socket = io('http://localhost:5000', {
    auth: { token: 'your-jwt-token' }
});
```

| Event | Sent To | Payload | Trigger |
|-------|---------|---------|---------|
| `gameStarted` | Everyone | `{ message }` | Admin starts game |
| `gameEnded` | Everyone | `{ message }` | Admin ends game |
| `teamDeleted` | Everyone | `{ teamId }` | Admin deletes team |
| `deckSizeUpdated` | Everyone | `{ maxDeckSize }` | Admin changes deck size |
| `pokemonCaught` | Everyone | `{ teamId, pokemonName, pokemonId }` | Any team catches a Pokémon |
| `pokemonAlreadyCaught` | Team only | `{ message, pokemonName }` | Team tries to catch taken Pokémon |
| `riddleInvalidated` | Affected teams | `{ message, pokemonName }` | Another team caught the riddle's answer |
| `pokemonReleased` | Team only | `{ pokemonId, pokemonName, message }` | Team releases a Pokémon |

---

## 🎯 Game Rules

- **100 unique Pokémon**, each with a physical QR code hidden on campus
- **Max 25 teams**, 3 members each
- Each team can hold up to **4 Pokémon** (admin can increase to 10)
- Each Pokémon can only be caught by **one team** (unique ownership)
- QR codes **deactivate after use** — no double catches
- Teams receive **riddles** to find their next Pokémon
- **10-minute cooldown** between riddle requests
- Catching is **transaction-safe** — no race conditions
- Admin controls game **start/end** in real-time

---

## 🖨️ Printing QR Codes

After running `node scripts/generateQR.js`:

1. Navigate to the `qr-codes/` folder
2. Each PNG is **400×400px** with **high error correction** (scannable even if partially damaged)
3. Print and place them at locations around campus
4. The filename matches the Pokémon name (e.g., `Pikachu.png`)

---

## 📜 Available Scripts

| Script                          | Description                              |
|---------------------------------|------------------------------------------|
| `npm start`                     | Start production server                  |
| `npm run dev`                   | Start dev server with hot-reload         |
| `npm run seed`                  | Seed database with Pokémon, riddles & admin |
| `node scripts/generateQR.js`   | Generate printable QR code images        |

---

## 📝 License

ISC
