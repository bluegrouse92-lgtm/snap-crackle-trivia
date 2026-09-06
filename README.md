# Snap Crackle Pop Trivia! 💥⚡🍿

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-blue.svg?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg?logo=vite)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg?logo=express)](https://expressjs.com/)
[![WebSockets](https://img.shields.io/badge/WebSockets-ws-orange.svg)](https://github.com/websockets/ws)
[![Gemini API](https://img.shields.io/badge/Powered_By-Google_Gemini-4285F4.svg?logo=google)](https://ai.google.dev/)

> **The electrifying retro-modern arcade game-show trivia battle!** Featuring reactive AI hosts, high-stakes wagering, dynamic voice narration, a resilient 3-tier trivia engine, streak multipliers, and real-time multiplayer lobbies.

---

## 🌟 Key Features Highlighted

### 💥 Retro-Modern Game-Show Aesthetic
- **Atmospheric Reactive Lighting**: Dynamic stage ambient colors that adapt in real-time to the current host's personality and mood.
- **Tactile 3D Arcade Answer Cards**: Responsive keyboard-mapped answer cards with keycaps (`Key 1`–`Key 4`), pulsating emerald glow for correct hits, and `animate-shake` on wrong choices.
- **Host Stage with Animated Audio Equalizer**: Speech bubbles with pointers anchored to the host avatar and animated soundwave equalizer bars that move whenever the host speaks.
- **Tension-Building Circular Countdown Timer**: Color transitions from neon teal to amber and danger crimson with critical pulse vibrations as time runs down.
- **Celebratory SFX & Confetti**: Dynamic particle bursts and Web Audio oscillator synthesized tones for hits, streaks, and victories.

---

### ⚡ 500-Question Local Weekly Bank (Zero Runtime API Dependency)
Gameplay never depends on external runtime APIs or incurs API billing per question. Questions are served locally and instantly from an autonomous **500-question weekly bank** refreshed weekly via a Google-grounded grab script and automated GitHub Actions cron:

```
[ Weekly Google Grab Script / GitHub Actions Cron (Mondays 00:00 UTC) ]
                               │
                               ▼
                [ data/weeklyQuestions.json ]
          (500 Verified Local Questions + Weekly Metadata)
                               │
                               ▼
                   [ server/weeklyManager.ts ]
                  (In-Memory Fast Indexed Cache)
                     │                     │
                     ▼                     ▼
          [ /api/generate-trivia ]    [ WebSocket Multiplayer Arena ]
          (Instant <5ms Response)      (Synchronized Live Rounds)
```

1. **Local Weekly Vault**: 500 questions evenly distributed across **Science & Nature (70)**, **World History (70)**, **Geography & Wonders (70)**, **Pop Culture & Gaming (70)**, **Literature & Arts (70)**, **Breaking News (70)**, and **All-Star Mix (80)**.
2. **Weekly Automated Refresh**: Runs automatically every Monday at 00:00 UTC via GitHub Actions, or manually anytime with `npm run update-questions`.
3. **Instant Zero-Lag Performance**: Sub-millisecond response time from local memory cache with zero network failure risks or quota bottlenecks during gameplay.

---

### 🎙️ 4 Dynamic AI Game-Show Hosts with Voice Narration
Each host brings a unique personality, commentary style, visual mood badges, and voice:

| Host | Archetype | Voice Tone | Specialty |
| :--- | :--- | :--- | :--- |
| **Sunny Spark** ☀️ | High-Energy Cheerleader | Upbeat & Enthusiastic | Uplifting praise, motivational hype, party vibes |
| **Roxy Roast** 🌶️ | Snarky Standup Comic | Quick-Witted & Sarcastic | Savage roasts, hilarious quips, banter |
| **Sterling Sage** 🧐 | Aristocratic Trivia Scholar | Refined & Eloquent | Historical context, scholarly praise, deep pedantry |
| **UNIT-74** 🤖 | Cold Computational Machine | Deadpan & Analytical | Logical evaluations, probability stats, glitch humor |

**Dual-Engine Narration**:
- Utilizes Google Gemini TTS when connected and falls back instantaneously to client-side **Web Speech API synthesis** with tuned pitch and rate settings tailored to each persona—guaranteeing 100% uninterrupted voice commentary with zero latency.

---

### 🪙 High-Stakes Wagering, Streaks & Multipliers
- **Wager System**: Put your hard-earned coin purse on the line! Bet 0 to 500+ coins per question or match to double your prize.
- **Hot Streaks**: String consecutive correct answers together to trigger escalating point multipliers (`🔥 2x`, `3x`, `5x`).
- **Coin Economy**: Collect daily login rewards and arcade payouts to unlock high-roller lobbies and premium lifelines.

---

### 🛡️ Game-Show Lifelines
Stuck on a brain-melter? Activate game-show lifelines directly from your HUD:
- **`50 / 50`**: Instantly wipes out two incorrect options.
- **`Skip Question`**: Pull a fresh replacement question from the generator without forfeiting your streak.
- **`+15s Extra Time`**: Add critical seconds to the clock when the question requires deep thought.

---

### 🕹️ Real-Time Multiplayer Arena & Bot Spawning
- **Live WebSocket Lobbies**: Create private or public rooms with custom room codes and invite friends.
- **Synchronized Rounds**: All players receive the question at the exact same millisecond with real-time buzzer timing.
- **Auto-Bot System**: Playing alone? The lobby automatically fills empty slots with autonomous bot competitors (`ByteMe`, `QuizTron`, `PixelPop`, `TurboBrain`) with distinct wagering behaviors!

---

### 🏆 Hall of Fame Leaderboard & Match Summary
- **Podium Review**: Displays accuracy percentage radial gauges, speed bonuses, multiplier breakdown, and coin earnings.
- **Fact-Checked Review**: Review all questions with explanations, fun facts, and search sources.
- **Persistent Leaderboard**: Submit your handle to claim Rank #1 in the Hall of Fame.

---

## 🎮 Keyboard Controls

| Key | Action |
| :---: | :--- |
| <kbd>1</kbd> or <kbd>A</kbd> | Select Option A |
| <kbd>2</kbd> or <kbd>B</kbd> | Select Option B |
| <kbd>3</kbd> or <kbd>C</kbd> | Select Option C |
| <kbd>4</kbd> or <kbd>D</kbd> | Select Option D |
| <kbd>Space</kbd> | Next Question / Continue |
| <kbd>Esc</kbd> | Return to Setup / Cancel |

---

## 🛠️ Tech Stack & Architecture

```
snap-crackle-trivia/
├── server.ts                 # Express HTTP + WebSocket server & 3-Tier Trivia Pipeline
├── server/
│   ├── trivia.ts             # Tier 3 offline trivia vault & question models
│   └── multiplayer.ts        # WebSocket room management, state sync, and bot logic
├── src/
│   ├── components/
│   │   ├── Header.tsx                 # Neon logo, streak multipliers, coin wallet
│   │   ├── HostStage.tsx              # Host avatar, speech bubble, audio equalizer
│   │   ├── TriviaQuestionCard.tsx     # 3D answer cards, countdown timer, lifelines
│   │   ├── GameSetupModal.tsx         # 8-category selector, custom search, wagers
│   │   ├── MultiplayerArena.tsx       # Live multiplayer room UI & buzzer board
│   │   ├── GameOverSummary.tsx        # Results podium, accuracy gauge, Hall of Fame
│   │   ├── LeaderboardModal.tsx       # High scores modal
│   │   └── PersonalitySelector.tsx    # Host audition selector with voice testing
│   ├── data/
│   │   └── triviaQuestions.ts         # Client offline question cache & trivia sets
│   ├── types.ts                       # TypeScript definitions for GameState, Hosts, etc.
│   ├── App.tsx                        # Core application state machine & sound synthesizer
│   └── index.css                      # Tailwind v4 theme, animations & custom glass styles
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun**

### 1. Clone the Repository
```bash
git clone https://github.com/bluegrouse92-lgtm/snap-crackle-trivia.git
cd snap-crackle-trivia
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your Gemini API key to enable live Google Search Grounding for breaking news and custom topics:
```env
GEMINI_API_KEY="your-api-key-here"
PORT=3000
```
*(Note: If no API key is provided, the app runs automatically in offline/OTDB mode with full functionality!)*

### 4. Run Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```

### 6. Refresh Weekly 500-Question Vault (Optional)
```bash
npm run update-questions
```
Grabs 500 fresh questions across all categories and updates `data/weeklyQuestions.json`.

---

## 📡 API Reference

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/health` | `GET` | Health check and server timestamp |
| `/api/weekly-status` | `GET` | Current week metadata, total question count, categories breakdown, and expiration |
| `/api/admin/refresh-questions` | `POST` | Hot-reloads weekly questions from `data/weeklyQuestions.json` |
| `/api/generate-trivia` | `POST` | Generates questions instantly from the local 500-question weekly bank (`category`, `difficulty`, `count`) |
| `/api/leaderboard` | `GET` | Retrieves top scores from the Hall of Fame |
| `/api/leaderboard` | `POST` | Submits a new score to the Hall of Fame |
| `/api/multiplayer/rooms` | `GET` | Lists active multiplayer lobbies |
| `/api/host-tts` | `POST` | Synthesizes neural host audio (returns fallback signal if key missing) |
| `/ws` | `WS` | WebSocket endpoint for real-time multiplayer synchronization |

---

## 📱 Mobile & Android Support
The codebase is structured to integrate with **Capacitor** for Android APK builds:
- GitHub Actions workflow available in [`.github/workflows/android.yml`](.github/workflows/android.yml).
- To sync with Capacitor locally:
  ```bash
  npx cap sync android
  cd android && ./gradlew assembleDebug
  ```

---

## 📄 License
This project is open-source and licensed under the [MIT License](LICENSE).
