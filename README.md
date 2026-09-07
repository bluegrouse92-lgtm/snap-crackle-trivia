# Snap Crackle Trivia! 💥⚡🍿


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
[ 
                     │                     │
                     ▼                     

### 🎙️ Dynamic AI Game-Show Hosts with Voice Narration
Each host brings a unique personality, commentary style, visual mood badges, and voice:

| Host | Archetype | Voice Tone | Specialty |
| :--- | :--- | :--- | :--- |
| **Sunny Spark** ☀️ | High-Energy Cheerleader | Upbeat & Enthusiastic | Uplifting praise, motivational hype, party vibes |
| **Roxy Roast** 🌶️ | Snarky Standup Comic | Quick-Witted & Sarcastic | Savage roasts, hilarious quips, banter |
| **Sterling Sage** 🧐 | Aristocratic Trivia Scholar | Refined & Eloquent | Historical context, scholarly praise, deep pedantry |
| **UNIT-74** 🤖 | Cold Computational Machine | Deadpan & Analytical | Logical evaluations, probability stats, glitch humor |


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

###. Refresh Weekly 500-Question Vault (Optional)
```bash
npm run update

```
Grabs 500 fresh questions across all categories and updates
---


## 📱 Mobile & Android Support
The codebase is structured to integrate with **Capacitor** for Android APK builds:

---

## 📄 License
This project is open-source and licensed under the [MIT License](LICENSE).
