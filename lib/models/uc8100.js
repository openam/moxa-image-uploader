const et = require('expect-telnet');
const debug = require('debug')('moxa-image-uploader:uc8112');
const { ports } = require('../store');
const status = require('../status');

const turnOnAllLeds = 'i2c dev 1 && pca953x dev 0x27 && pca953x o 8 1 && pca953x o 9 1 && pca953x o a 1 && pca953x o b 1 && pca953x o c 1 && pca953x o d 1 && pca953x o e 1 && pca953x o f 1 && gpio set 20';
const turnOffRedAndYellowLeds = 'i2c dev 1 && pca953x dev 0x27 && pca953x o 8 0 && pca953x o 9 0 && pca953x o a 1 && pca953x o b 0 && pca953x o c 0 && pca953x o d 1 && pca953x o e 1 && pca953x o f 1 && gpio set 20';

const timeout = 2000;

module.exports = async function uploadImage(
  portName, tftpServerIP, tftpDeviceIP, fileName, imageTimeout, rebootToFinish,
) {
  const port = ports[portName];
  return new Promise((resolve, reject) => {
    const steps = [
      // Enter Bootloader
      // {expect: 'Press <DEL>', send: `${String.fromCharCode(127)}\n`, out: console.log},
      {
        expect: 'Press <DEL>',
        send: '***\n\n',
        timeout: 5 * 60 * 1000,
        out: (output) => {
          port.status = status.UPLOAD_IMAGE_ENTERED_BIOS;
          port.updatedAt = Date.now();
          debug(output);
        },
      },
      {
        expect: 'Command>>',
        timeout,
        send: 'q\n\n\n',
        out: debug,
      },

      // Turn on LEDs
      {
        expect: 'U-Boot#',
        timeout,
        send: `${turnOnAllLeds}\n\n`,
        out: debug,
      },
      {
        expect: 'U-Boot#',
        timeout,
        send: 'mm_bios\n',
        out: debug,
      },

      // Update from TFTP
      {
        expect: 'Command>>',
        timeout,
        send: '1\n', // (1) Download/Upload
        out: debug,
      },

      {
        expect: 'Command>>',
        timeout,
        send: '1\n', // (1) Firmware
        out: debug,
      },

      {
        expect: 'Command>>',
        timeout,
        send: '0\n', // (0) Copy File From TFTP
        out: debug,
      },

      {
        expect: 'enter for abort',
        timeout,
        send: '1\n', // 1 - Yes, change the ip address
        out: debug,
      },
      {
        expect: 'Local IP Address',
        timeout,
        send: `${tftpDeviceIP}\n`, // Local IP Address
        out: debug,
      },
      {
        expect: 'Server IP Address',
        timeout,
        send: `${tftpServerIP}\n`, // Server IP Address
        out: debug,
      },
      {
        expect: 'firmware.img',
        timeout,
        send: `${fileName}\n\n`,
        out: (output) => {
          port.status = status.UPLOAD_IMAGE_START;
          port.updatedAt = Date.now();
          debug(output);
        },
      },
      {
        expect: 'success',
        send: '',
        timeout: imageTimeout,
        out: debug,
      },
    ];

    debug(`rebootToFinish is ${rebootToFinish}`);
    if (rebootToFinish) {
      steps.push(
        {
          expect: 'Command>>',
          timeout,
          send: '2\n\n',
          out: (output) => {
            debug(output);
            port.status = status.UPLOAD_IMAGE_WAITING_FOR_REBOOT;
            port.updatedAt = Date.now();
          },
        },
      );
    } else {
      steps.push(
        {
          expect: 'Command>>',
          timeout,
          send: 'q\n\n\n',
          out: debug,
        },
        {
          expect: 'Command>>',
          timeout,
          send: 'q\n\n\n',
          out: debug,
        },
        {
          expect: 'Command>>',
          timeout,
          send: 'q\n\n\n',
          out: debug,
        },
        // Turn off Red and Yellow LEDs
        {
          expect: 'U-Boot#',
          timeout,
          send: `${turnOffRedAndYellowLeds}\n\n`,
          out: debug,
        },
      );
    }

    et(`${port.serverIP}:${port.serverPort}`, steps, { timeout: Number.MAX_SAFE_INTEGER, exit: false, pipe: process.stdout }, (err) => {
      debug('Error doing steps with expect-telnet', err);
      if (err) return reject(err);
      return resolve();
    });
  });
};
