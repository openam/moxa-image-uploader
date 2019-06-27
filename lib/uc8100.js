const et = require('expect-telnet');
const debug = require('debug')('moxa-image-uploader:uc8112');
const { ports } = require('./store');

// TODO: need to figure out how to turn on the LEDs to indicate that the upload is happening

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
          port.updatedAt = Date.now();
          debug(output);
        },
      },
      { expect: 'Command>>', send: 'q\n\n\n', out: debug },

      // Turn on LEDs
      // { expect: '=>', send: `${turnOnAllLeds}\n\n`, out: debug },
      { expect: 'U-Boot#', send: 'bios\n', out: debug },

      // Update from TFTP
      { expect: 'Command>>', send: '0\n', out: debug }, // (0) Firmware

      // {expect: 'Command>>', send: "2\n", out: console.log }, // (2) Copy File From TFTP
      { expect: 'enter for abort', send: '1\n', out: debug }, // 1 - Yes, chnage the ip address
      { expect: 'Local IP Address', send: `${tftpDeviceIP}\n`, out: debug }, // Local IP Address
      { expect: 'Server IP Address', send: `${tftpServerIP}\n`, out: debug }, // Server IP Address
      {
        expect: 'firmware.img',
        send: `${fileName}\n\n`,
        out: (output) => {
          port.status = 'UPLOAD_IMAGE_START';
          port.updatedAt = Date.now();
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
          send: '2\n\n',
          out: (output) => {
            debug(output);
            port.status = 'UPLOAD_IMAGE_WAITING_FOR_REBOOT';
            port.updatedAt = Date.now();
          },
        },
      );
    }

    et(`${port.serverIP}:${port.serverPort}`, steps, { timeout: 60000, exit: true, pipe: process.stdout }, (err) => {
      if (err) return reject(err);
      return resolve();
    });
  });
};
