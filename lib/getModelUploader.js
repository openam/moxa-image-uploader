const uc3100v1 = require('./models/uc3100-v1');
const uc3100v2 = require('./models/uc3100-v2');
const uc8100 = require('./models/uc8100');
const compareVersions = require('./compareVersions');

function getModelUploader(port) {
  const { modelName, bootloaderVersion } = port.device;

  if (/3100|3111|3121/.test(modelName)) {
    if (compareVersions(bootloaderVersion, '1.3.0S07') >= 0) {
      return uc3100v2;
    }

    return uc3100v1;
  }

  if (/8100|8112/.test(modelName)) {
    return uc8100;
  }

  throw new Error('Could not determine model number to use');
}

module.exports = getModelUploader;
