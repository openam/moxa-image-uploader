const et = require('expect-telnet');
const debug = require('debug')('moxa-image-uploader:uc8112');
const { ports } = require('./store');
const status = require('./status');

// TODO: need to figure out how to turn on the LEDs to indicate that the upload is happening

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
      // { expect: '=>', timeout, send: `${turnOnAllLeds}\n\n`, out: debug },
      {
        expect: 'U-Boot#',
        timeout,
        send: 'bios\n',
        out: debug,
      },

      // Update from TFTP
      {
        expect: 'Command>>',
        timeout,
        send: '0\n', // (0) Firmware
        out: debug,
      },

      {
        expect: 'enter for abort',
        timeout,
        send: '1\n', // 1 - Yes, chnage the ip address
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
          },
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
