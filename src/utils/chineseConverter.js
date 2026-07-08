const OpenCC = require('opencc-js/core');
const Locale = require('opencc-js/preset');

const simplifiedToTaiwanTraditionalConverter = OpenCC.ConverterFactory(
  Locale.from.cn,
  Locale.to.tw
);
const taiwanTraditionalToSimplifiedConverter = OpenCC.ConverterFactory(
  Locale.from.tw,
  Locale.to.cn
);

/**
 * 将简体中文转换为台湾繁体中文。
 *
 * @param {string} text 原始文本
 * @returns {string} 转换后的文本
 */
function simplifiedToTraditional(text) {
  return simplifiedToTaiwanTraditionalConverter(String(text || ''));
}

/**
 * 将台湾繁体中文转换为简体中文。
 *
 * @param {string} text 原始文本
 * @returns {string} 转换后的文本
 */
function traditionalToSimplified(text) {
  return taiwanTraditionalToSimplifiedConverter(String(text || ''));
}

module.exports = {
  simplifiedToTraditional,
  traditionalToSimplified,
};
