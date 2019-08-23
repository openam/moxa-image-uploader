/**
 *
 * @param {string} first - the first bootloader version
 * @param {string} second - the second bootloader version
 * @returns {number} - Numeric value compatible with the [Array.sort(fn) interface](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#Parameters).
 */
function compareVersions(first, second) {
  if ((first.match(/[A-Z]/) || [])[0] !== (second.match(/[A-Z]/) || [])[0]) {
    throw new Error(`Incompatible version checks ${first} vs ${second}`);
  }

  const aPieces = first.split(/[.A-Z]/);
  const bPieces = second.split(/[.A-Z]/);

  if (aPieces.length !== bPieces.length) {
    throw new Error(`Different version formats ${first} vs ${second}`);
  }

  let value = 0;

  for (let i = 0; i < aPieces.length; i += 1) {
    const a = +aPieces[i];
    const b = +bPieces[i];

    if (a < b) {
      value = -1;
      break;
    } else if (a > b) {
      value = 1;
      break;
    }
  }

  return value;
}

module.exports = compareVersions;
