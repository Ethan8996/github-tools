const test = require('node:test');
const assert = require('node:assert/strict');

const {
  simplifiedToTraditional,
  traditionalToSimplified,
} = require('../src/utils/chineseConverter');

test('simplifiedToTraditional converts Simplified Chinese to Taiwan Traditional Chinese', () => {
  assert.equal(simplifiedToTraditional('汉语'), '漢語');
});

test('traditionalToSimplified converts Taiwan Traditional Chinese to Simplified Chinese', () => {
  assert.equal(traditionalToSimplified('漢語'), '汉语');
});

test('Chinese converter keeps empty and non-Chinese text unchanged', () => {
  assert.equal(simplifiedToTraditional(''), '');
  assert.equal(traditionalToSimplified(''), '');
  assert.equal(simplifiedToTraditional('GitHub 123'), 'GitHub 123');
  assert.equal(traditionalToSimplified('GitHub 123'), 'GitHub 123');
});
