export const BANTER_LIBRARY = {
  correct: [
    "Boom! That's how you do it!",
    "Too easy for you, isn't it?",
    "Sharp as a tack! Correct.",
    "Did you just guess that? Impressive.",
    "Correct! Are you sure you haven't seen this before?",
  ],
  wrong: [
    "Oh dear. That was... embarrassing.",
    "Did you close your eyes and pick that?",
    "Absolutely not! Try again next time.",
    "I've seen smarter responses from a brick.",
    "Wrong! Don't worry, you'll get better... maybe.",
  ],
  timeout: [
    "Time's up! Slowpoke.",
    "The clock beat you! Try to keep up.",
    "Too slow! That's a missed opportunity.",
    "You know, time is money. You just lost both.",
  ],
  lifeline: [
    "Need a crutch? Fine, here's a hand.",
    "Don't cry about it, I'll help you this once.",
    "Alright, here's the secret. Don't tell anyone.",
  ],
  game_over: [
    "Match over! Hope that was worth your time.",
    "Done already? Let's see how you did.",
    "Final tally is in. Let's look at the damage.",
  ],
};

export const getRandomBanter = (eventType: keyof typeof BANTER_LIBRARY): string => {
  const options = BANTER_LIBRARY[eventType];
  return options[Math.floor(Math.random() * options.length)];
};
