const crypto = require("crypto");

/**
 * Fisher–Yates shuffle using Node's cryptographically secure, unbiased
 * randomInt() rather than Math.random(). Returns a new array.
 */
function shuffleDeck(deck) {
  if (!Array.isArray(deck)) throw new TypeError("deck phải là một mảng");

  const shuffled = deck.slice();
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

module.exports = { shuffleDeck };
