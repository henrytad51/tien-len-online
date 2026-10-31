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

/**
 * Chia đúng 13 lá cho mỗi người (tối đa 4 người).
 * Các lá còn lại được giữ ngoài tay người chơi.
 */
function dealHands(deck, playerCount) {
  if (!Array.isArray(deck)) throw new TypeError("deck phải là một mảng");
  if (!Number.isInteger(playerCount) || playerCount < 2 || playerCount > 4) {
    throw new RangeError("Số người chơi phải từ 2 đến 4");
  }
  if (deck.length < playerCount * 13) {
    throw new RangeError("Không đủ bài để chia 13 lá cho mỗi người");
  }

  const hands = Array.from({ length: playerCount }, () => []);
  deck.slice(0, playerCount * 13).forEach((card, index) => {
    hands[index % playerCount].push(card);
  });
  return hands;
}

module.exports = { shuffleDeck, dealHands };
