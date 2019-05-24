const et = require("expect-telnet");
const debug = require('debug')('moxa-image-uploader:uc3100');
const turnOnAllLeds = 'i2c dev 0 && pca953x dev 0x27 && pca953x o 0x8 0 && pca953x o 0x9 0 && pca953x o 0xa 0 && pca953x o 0xb 0 && pca953x o 0xc 0 && pca953x o 0xd 0 && pca953x o 0xe 0 && pca953x o 0xf 0';

module.exports = async function(serverIP, serverPort, tftpServerIP, tftpDeviceIP, fileName, timeout, rebootToFinish) {
  return new Promise((resolve, reject) => {
    const steps = [
      // Enter Bootloader
      //{expect: 'Press <DEL>', send: `${String.fromCharCode(127)}\n`, out: console.log},
      {expect: 'Press <DEL>', send: `***\n\n`, out: debug},
      {expect: 'Command>>', send: `q\n\n\n`, out: debug},
      // Turn on LEDs
      {expect: '=>', send: `${turnOnAllLeds}\n\n`, out: debug},
      {expect: '=>', send: `bios\n`, out: debug},
      // Update from TFTP
      {expect: 'Command>>', send: "1\n", out: debug}, // (1) Firmware
      // {expect: 'Command>>', send: "2\n", out: console.log }, // (2) Copy File From TFTP
      {expect: '(Enter to abort)', send: "1\n", out: debug}, // 1 - Yes, chnage the ip address
      {expect: 'Local IP Address', send: `${tftpDeviceIP}\n`, out: debug}, // Local IP Address
      {expect: 'Server IP Address', send: `${tftpServerIP}\n`, out: debug}, // Server IP Address
      {expect: 'firmware.img', send: `${fileName}\n`, out: debug},
      {expect: 'success', send: '', timeout: 900000, out: debug},
    ];

    debug(`rebootToFinish is ${rebootToFinish}`);
    if (rebootToFinish) {
      steps.push({expect: 'Command>>', send: '3\n\n', out: debug});
    }

    et(`${serverIP}:${serverPort}`, steps, {timeout: 60000, exit: true}, (err) => {
      if (err) return reject(err);
      resolve();
    });

  });
}
