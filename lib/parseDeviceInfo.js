/* eslint-disable no-control-regex, no-param-reassign */
const debug = require('debug')('moxa-image-uploader:parseDeviceInfo');

module.exports = function parseDeviceInfo(device) {
  return function parse(output) {
    const regex = /Model:? (.*)Boot Loader Version:? (.*) CPU TYPE:? (.*)Build date:? (.*) Serial Number:? ([\w:]+).*?LAN1 MAC:? ([\w:]+).*?LAN2 MAC:? ([\w:]+)/s;
    const m = regex.exec(output);
    if (m !== null) {
      // m.forEach((match, groupIndex) => {
      //   debug(`Group ${groupIndex}: ${match.trim()}`);
      //   device[groupIndex] = match.trim();
      // });

      if (m.length !== 8) {
        device.err = 'Can\'t parse Bootloader info, new Model? new Bootloader verison?';
        device.errData = output;
        debug(output);
        return;
      }

      device.modelName = m[1].trim().replace(/\r/g, '').replace(/\u0000/g, '');
      device.bootloaderVersion = m[2].trim();
      device.cpuType = m[3].trim().replace(/\r/g, '').replace(/\u0000/g, '');
      device.bootloaderBuildDate = m[4].trim();
      device.serialNumber = m[5].trim();
      device.MAC1 = m[6].trim();
      device.MAC2 = m[7].trim();
      return;
    }

    device.err = 'Can\'t parse Bootloader info, new Model? new Bootloader verison?';
    device.errData = output;
    debug(output);
  };
};
