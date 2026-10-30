const test = require("node:test");
const assert = require("node:assert/strict");
const { shuffleDeck } = require("./deck");

const SUITS = ["♠", "♣", "♦", "♥"];
const RANKS = ["3","4","5","6","7","8","9","10","J","Q","K","A","2"];
const makeDeck = () => RANKS.flatMap(rank =>
  SUITS.map(suit => ({ rank, suit, id: rank + suit }))
);

test("xáo bài giữ đủ 52 lá, không trùng ID", () => {
  const shuffled = shuffleDeck(makeDeck());
  assert.equal(shuffled.length, 52);
  assert.equal(new Set(shuffled.map(card => card.id)).size, 52);
  assert.deepEqual(
    shuffled.map(card => card.id).sort(),
    makeDeck().map(card => card.id).sort()
  );
});

test("xáo bài không thay đổi bộ bài đầu vào", () => {
  const original = makeDeck();
  const snapshot = structuredClone(original);
  shuffleDeck(original);
  assert.deepEqual(original, snapshot);
});

test("các lần xáo tạo thứ tự khác nhau trong kiểm tra lặp", () => {
  const original = makeDeck();
  const first = shuffleDeck(original).map(card => card.id).join(",");
  let different = false;
  for (let i = 0; i < 10; i += 1) {
    if (shuffleDeck(original).map(card => card.id).join(",") !== first) {
      different = true;
      break;
    }
  }
  assert.equal(different, true);
});

test("chia đều bài cho 2 đến 8 người, không phát trùng lá", () => {
  for (let count = 2; count <= 8; count += 1) {
    const deck = shuffleDeck(makeDeck());
    const hands = Array.from({ length: count }, () => []);
    deck.slice(0, Math.floor(52 / count) * count)
      .forEach((card, index) => hands[index % count].push(card));
    const dealt = hands.flat();
    assert.equal(dealt.length, 52 - (52 % count));
    assert.equal(new Set(dealt.map(card => card.id)).size, dealt.length);
    assert.ok(hands.every(hand => hand.length === Math.floor(52 / count)));
  }
});
