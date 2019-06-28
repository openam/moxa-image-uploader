const uc3100 = require('./models/uc3100');
const uc8100 = require('./models/uc8100');

function uploadImage(port) {
    const { modelName } = port.device;
  
    if (/3100|3111|3121/.test(modelName)) {
      return uc3100;
    }
  
    if (/8100|8112/.test(modelName)) {
      return uc8100;
    }
  
    return function errorCase() {
      return new Promise((resolve, reject) => {
        reject(new Error('Could not determine model number to use'));
      });
    };
  }

module.exports = uploadImage;