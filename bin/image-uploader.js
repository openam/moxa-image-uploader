#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
const chalk = require('chalk');
const debug = require('debug')('moxa-image-uploader:cli');
const argv = require('yargs') // eslint-disable-line
  .option('tftp-server-ip', {
    alias: 'ts',
    describe: 'TFTP Server IP (where device download image from)',
    demandOption: true,
  })
  .option('tftp-device-ip', {
    alias: 'td',
    describe: 'TFTP Device IP (device IP address for TFTP)',
    demandOption: true,
  })
  .option('upload-image-timeout', {
    alias: 't',
    describe: 'Upload image timeout in millsecond',
    default: 20 * 60 * 1000,
  })
  .option('terminal-server-host', {
    alias: 's',
    describe: 'Terminal server host',
    default: '192.168.127.254',
  })
  .option('terminal-server-port', {
    alias: 'p',
    describe: 'Terminal server port',
    default: 4001,
  })
  .option('image', {
    alias: 'i',
    describe: 'Image name',
    default: 'image.img',
  })
  .option('continue', {
    alias: 'c',
    describe: 'Upload image for every new detected device',
    default: true,
  })
  .option('verbose', {
    alias: 'v',
    default: false,
  })
  .argv;

debug(argv);
process.env.SERVER_COUNT = 1;
process.env.SERVER_1 = `${argv['terminal-server-host']},${argv['terminal-server-port']},1`;

const captureDevice = require('../lib/captureDevice');
const getModelUploader = require('../lib/getModelUploader');
const { ports } = require('../lib/store');


(async () => {
  while (argv.continue) {
    console.log(chalk.green('waiting for device...'));
    await captureDevice('Server1Port1');
    debug(ports);
    console.log(chalk.grey('entering bootloader for uploading image...'));
    await (async () => {
      try {
        const port = ports.Server1Port1;
        const modelUploader = getModelUploader(port);
        await modelUploader(
          port.name,
          argv['tftp-server-ip'],
          argv['tftp-device-ip'],
          argv.image,
          argv['upload-image-timeout'],
          false,
        );
      } catch (err) {
        console.log(chalk.red('upload image error'));
        console.log(err);
      }
      console.log(chalk.blue('upload image successfully'));
    })();
  }
})();
