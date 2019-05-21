const et = require("expect-telnet");
const targetIPAddress = process.env.TARGET_IP_ADRRESS;
const targetTCPPort = process.env.TARGET_TCP_PORT;
const deviceIPAddress = process.env.DEVICE_IP_ADDRESS;
const tftpServerIPAddress = process.env.TFTP_SERVER_IP_ADDRESS;
const imageName = process.env.IMAGE_NAME;

function parseDeviceInfo(output) {
  const regex = /Model: (.*)Boot Loader Version: (.*) CPU TYPE: (.*)Build date: (.*) Serial Number: ([\w:]+).*?LAN1 MAC: ([\w:]+).*?LAN2 MAC: ([\w:]+)/s;
  let m;
  if ((m = regex.exec(output)) !== null) {
    m.forEach((match, groupIndex) => {
      console.log(`Group ${groupIndex}: ${match.trim()}`);
    });
  }
}

const turnOnAllLeds = 'i2c dev 0 && pca953x dev 0x27 && pca953x o 0x8 0 && pca953x o 0x9 0 && pca953x o 0xa 0 && pca953x o 0xb 0 && pca953x o 0xc 0 && pca953x o 0xd 0 && pca953x o 0xe 0 && pca953x o 0xf 0';

async function uploadImage() {
  return new Promise((resolve, reject) => {
    console.log(`Connecting to ${targetIPAddress}:${targetTCPPort}...`)
    et(`${targetIPAddress}:${targetTCPPort}`, [
      // Enter Bootloader
      //{expect: 'Press <DEL>', send: `${String.fromCharCode(127)}\n`, out: console.log},
      {expect: 'Press <DEL>', send: `***\n\n`, out: console.log},
      {expect: 'Command>>', send: `q\n\n\n`, out: console.log},
      // Turn on LEDs
      {expect: '=>', send: `${turnOnAllLeds}\n\n`, out: console.log},
      {expect: '=>', send: `bios\n`, out: console.log},
      // Update from TFTP
      {expect: 'Command>>', send: "1\n", out: parseDeviceInfo}, // (1) Firmware
      // {expect: 'Command>>', send: "2\n", out: console.log }, // (2) Copy File From TFTP 
      {expect: '(Enter to abort)', send: "1\n", out: console.log}, // 1 - Yes, chnage the ip address
      {expect: 'Local IP Address', send: `${deviceIPAddress}\n`, out: console.log}, // Local IP Address
      {expect: 'Server IP Address', send: `${tftpServerIPAddress}\n`, out: console.log}, // Server IP Address
      {expect: 'firmware.img', send: `${imageName}\n`, out: console.log},
      {expect: 'success', send: '', timeout: 900000, out: console.log},
      {expect: 'Command>>', send: '3\n\n', out: console.log}, // Go to OS
    ],
    {timeout: 60000, exit: true},
    (err) => {
      if (err) return reject(err);
      resolve();
      console.log('Done');
    });
  
  });
}

uploadImage();