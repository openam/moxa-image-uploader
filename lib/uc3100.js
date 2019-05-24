const et = require('expect-telnet');
const debug = require('debug')('moxa-image-uploader:uc3100');
const { ports } = require('./store');

const turnOnAllLeds = 'i2c dev 0 && pca953x dev 0x27 && pca953x o 0x8 0 && pca953x o 0x9 0 && pca953x o 0xa 0 && pca953x o 0xb 0 && pca953x o 0xc 0 && pca953x o 0xd 0 && pca953x o 0xe 0 && pca953x o 0xf 0';

module.exports = async function uploadImage(
  portName, tftpServerIP, tftpDeviceIP, fileName, timeout, rebootToFinish,
) {
  const port = ports[portName];
  return new Promise((resolve, reject) => {
    const steps = [
      // Enter Bootloader
      // {expect: 'Press <DEL>', send: `${String.fromCharCode(127)}\n`, out: console.log},
      {
        expect: 'Press <DEL>',
        send: '***\n\n',
        out: (output) => {
          port.status = 'UPLOAD_IMAGE_ENTERED_BIOS';
          debug(output);
        },
      },
      { expect: 'Command>>', send: 'q\n\n\n', out: debug },

      // Turn on LEDs
      { expect: '=>', send: `${turnOnAllLeds}\n\n`, out: debug },
      { expect: '=>', send: 'bios\n', out: debug },

      // Update from TFTP
      { expect: 'Command>>', send: '1\n', out: debug }, // (1) Firmware

      // {expect: 'Command>>', send: "2\n", out: console.log }, // (2) Copy File From TFTP
      { expect: '(Enter to abort)', send: '1\n', out: debug }, // 1 - Yes, chnage the ip address
      { expect: 'Local IP Address', send: `${tftpDeviceIP}\n`, out: debug }, // Local IP Address
      { expect: 'Server IP Address', send: `${tftpServerIP}\n`, out: debug }, // Server IP Address
      {
        expect: 'firmware.img',
        send: `${fileName}\n`,
        out: (output) => {
          port.status = 'UPLOAD_IMAGE_START';
          debug(output);
        },
      },
      {
        expect: 'success', send: '', timeout, out: debug,
      },
    ];

    debug(`rebootToFinish is ${rebootToFinish}`);
    if (rebootToFinish) {
      steps.push(
        {
          expect: 'Command>>',
          send: '3\n\n',
          out: (output) => {
            debug(output);
            port.status = 'UPLOAD_IMAGE_WAITING_FOR_REBOOT';
          },
        },
      );
    }

    et(`${port.serverIP}:${port.serverPort}`, steps, { timeout: 60000, exit: true }, (err) => {
      if (err) return reject(err);
      return resolve();
    });
  });
};
