const debug = require('debug')('MXSerialBot');
// const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
// const port = new SerialPort('/dev/ttyUSB2', {
//     baudRate: 115200,
//     dataBits: 8,
//     stopBits: 1,
//     parity: 'none',
// });

class UC8100ME {
  constructor(options) {
    this.serial = options.serial;
    this.parser = this.serial.pipe(new Readline({ delimiter: '\n' }));
    this.bootloaderVersion = '';
    this.imageFilename = 'FWR_UC-8100-ME-T-LX-CG_2.0.2_Build_20170929-062311.img';
    this.tftp = {
      deviceIP: '192.168.116.77',
      serverIP: '192.168.116.102',
    };

    this.currentStep = 0;
    this.steps = [
      {
        name: 'Enter BIOS menu',
        regex: /Net:   cpsw0, cpsw1/g,
        action: [
          () => this.write('*'),
        ],
      },
      {
        name: 'Enter BIOS menu',
        regex: '',
        action: [],
      },
    ];
  }
  async write(string) {
    let noDrain;
    return new Promise((resolve, reject) => {
      noDrain = this.serial.write(string, (err) => {
        if (err) return reject(err);
        return resolve();
      });
    })
    .then(() => {
      if (noDrain) return Promise.resolve();
      return new Promise((resolve, reject) => {
        this.serial.drain((err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  }

  onData(data) {
    const step = this.steps[this.currentStep];
    if (!step.regex.test(data)) {
      debug('check failed. continue.');
      return;
    }

    (async () => {
      debug('executing action');
      await step.action[0]();
      console.log(this.serial.binding.recording.toString());
    })();
  }

  start() {
    this.parser.on('data', this.onData.bind(this));
  }
}

const SerialPort = require('@serialport/stream');
const MockBinding = require('@serialport/binding-mock');
SerialPort.Binding = MockBinding;
MockBinding.createPort(
  '/dev/ROBOT',
  { echo: true, record: true },
);
const port = new SerialPort('/dev/ROBOT');

const instance = new UC8100ME({
  serial: port,
});

port.on('open', function() {
  port.binding.emitData(`asdfasdfas
  asdfasdfNet:   cpsw0, cpsw1asdfasdfas
  asdf`);
})


instance.start();



// const deviceIP = '192.168.116.77';
// const deviceNetMask = '255.255.255.0';
// const tftpServerIP = '192.168.116.102';
// const imageName = 'FWR_UC-8100-ME-T-LX-CG_2.0.2_Build_20170929-062311.img';
// let upgrading = false;
// const lineParser = port.pipe(new Readline({ delimiter: '\n' }));
// lineParser.on('data', (line) => {
//     console.log(line);
//     // Bootloader menu
//     if (!upgrading) {
//         if (line.indexOf('Net:   cpsw0, cpsw1') != -1) {
//             console.log('press * to enter BIOS');
//             port.write('*');
//             port.drain(() => console.log);
//         } else if (line.indexOf('(q) UBoot Command Line') != -1) {
//             console.log('press 1: (1) Download/Upload');
//             port.write('1\n');
//             port.drain(() => console.log);
//         } else if (line.indexOf('(6) User Disk') != -1) {
//             console.log('press 1: (1) Firmware');
//             port.write('1\n');
//             port.drain(() => console.log);
//         } else if (line.indexOf('(0) Copy File From TFTP') != -1) {
//             console.log('press 0: (0) Copy File From TFTP');
//             port.write('0\n');
//             port.write('1\n'); // Yes for change IP
//             port.write(deviceIP + '\n');
//             port.write(tftpServerIP + '\n');
//             port.drain(() => console.log);
//         } else if (line.indexOf('Erasing SPI flash...Writing to SPI flash...done') != -1) {
//             console.log('wait to enter firmare img name');
//             port.write(imageName + '\n');
//             port.drain(() => console.log);
//         } else if (line.indexOf(`TFTP from server ${tftpServerIP}; our IP address is ${deviceIP}`) != -1) {
//             console.log('Start downloading the firmware');
//             port.write(imageName + '\n');
//             port.drain(() => console.log);
//             upgrading = true;
//         }
//     } else if (line.indexOf('TFTP FIRMWARE file transfer success') != -1) {
//         console.log('upgrading success!');
//         port.write('q\nq\nq\nq\nq\nq\nq\n');
//         port.write('reset\n');
//     }
// });
