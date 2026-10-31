const test = require("node:test");
const assert = require("node:assert/strict");
const { shuffleDeck, dealHands } = require("./deck");

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

test("mỗi người nhận đúng 13 lá khi có 2, 3 hoặc 4 người; bài dư không chia", () => {
  for (let count = 2; count <= 4; count += 1) {
    const deck = shuffleDeck(makeDeck());
    const hands = dealHands(deck, count);
    const dealt = hands.flat();
    assert.equal(hands.length, count);
    assert.ok(hands.every(hand => hand.length === 13));
    assert.equal(dealt.length, count * 13);
    assert.equal(new Set(dealt.map(card => card.id)).size, dealt.length);
    assert.equal(deck.length - dealt.length, 52 - count * 13);
  }
});

test("không cho chia cho ít hơn 2 hoặc nhiều hơn 4 người", () => {
  assert.throws(() => dealHands(makeDeck(), 1), RangeError);
  assert.throws(() => dealHands(makeDeck(), 5), RangeError);
});
