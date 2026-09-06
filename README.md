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

### ⚡ Resilient 3-Tier Trivia Engine
Never run out of questions or encounter generation timeouts. The engine uses a robust waterfall strategy:

```
[ Incoming Game Request ]
          │
          ├── Tier 1: Gemini 2.5 Flash + Google Search Grounding (Live Breaking News & Custom Topics)
          │           └─ Failure / No Key / Offline?
          ▼
          ├── Tier 2: Open Trivia Database (OTDB API with full HTML entity decoding)
          │           └─ Rate Limited / Offline?
          ▼
          └── Tier 3: Curated Offline Trivia Vault (60+ questions across 7 categories & 3 difficulties)
```

1. **Tier 1 (Gemini Search Grounding)**: Fetches real-time, verified trivia on breaking news, live events, or custom user queries with search grounding citations.
2. **Tier 2 (Open Trivia Database)**: Rapid public trivia fallback featuring robust HTML entity sanitization (`&quot;`, `&#039;`, `&eacute;`, `&deg;`, numeric entities).
3. **Tier 3 (Local Offline Vault)**: Deep question vault categorized into **Science & Nature**, **World History**, **Geography & Wonders**, **Pop Culture & Gaming**, **Literature & Arts**, **Breaking News**, and **All-Star Mix** across **Easy**, **Medium**, and **Hard** tiers.

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

---

## 📡 API Reference

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/health` | `GET` | Health check and server timestamp |
| `/api/generate-trivia` | `POST` | Generates questions via 3-tier engine (`category`, `difficulty`, `count`, `topic`) |
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
