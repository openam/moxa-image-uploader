const et = require('expect-telnet');
const debug = require('debug')('moxa-image-uploader:uc3100');
const { ports } = require('../store');
const status = require('../status');

const turnOnAllLeds = 'i2c dev 0 && pca953x dev 0x27 && pca953x o 0x8 0 && pca953x o 0x9 0 && pca953x o 0xa 0 && pca953x o 0xb 0 && pca953x o 0xc 0 && pca953x o 0xd 0 && pca953x o 0xe 0 && pca953x o 0xf 0';

const timeout = 2000;

module.exports = async function upload3100ImageV2(
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
        expect: '=>',
        timeout,
        send: `${turnOnAllLeds}\n\n`,
        out: debug,
      },
      {
        expect: '=>',
        timeout,
        send: 'bios\n',
        out: debug,
      },

      // Update from TFTP
      {
        expect: 'Command>>',
        timeout,
        send: '1\n', // (1) Firmware
        out: debug,
      },

      {
        expect: '(Enter to abort)',
        timeout,
        send: '1\n', // 1 - Yes, change the ip address
        out: debug,
      },
      {
        expect: 'Local IP Address',
        timeout,
        send:
        `${tftpDeviceIP}\n`, // Local IP Address
        out: debug,
      },
      {
        expect: 'Server IP Address',
        timeout,
        send: `${tftpServerIP}\n`, // Server IP Address
        out: debug,
      },
      {
        expect: '(Enter to abort)',
        timeout,
        send: '1\n', // 1 - Yes, change the TFTP port
        out: debug,
      },
      {
        expect: '(Enter to abort)',
        timeout,
        send: `${process.env.TFTP_PORT || 1}\n`, // 2 - Yes, change the port to LAN2
        out: debug,
      },
      {
        expect: 'firmware.img',
        timeout,
        send: `${fileName}\n`,
        out: (output) => {
          port.status = status.UPLOAD_IMAGE_START;
          port.updatedAt = Date.now();
          debug(output);
        },
      },
      {
        expect: 'success', send: '', timeout: imageTimeout, out: debug,
      },
    ];

    debug(`rebootToFinish is ${rebootToFinish}`);
    if (rebootToFinish) {
      steps.push(
        {
          expect: 'Command>>',
          timeout,
          send: '3\n\n',
          out: (output) => {
            debug(output);
            port.status = status.UPLOAD_IMAGE_WAITING_FOR_REBOOT;
            port.updatedAt = Date.now();
          },
        },
      );
    }

    et(`${port.serverIP}:${port.serverPort}`, steps, { timeout: Number.MAX_SAFE_INTEGER, exit: false }, (err) => {
      debug('Error doing steps with expect-telnet', err);
      if (err) return reject(err);
      return resolve();
    });
  });
};
