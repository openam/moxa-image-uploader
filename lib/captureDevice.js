const et = require("expect-telnet");
const debug = require('debug')('moxa-image-uploader:captureDevice');
const ports = require('./store').ports;
const devices = require('./store').devices;

function parseDeviceInfo(output) {
  const regex = /Model: (.*)Boot Loader Version: (.*) CPU TYPE: (.*)Build date: (.*) Serial Number: ([\w:]+).*?LAN1 MAC: ([\w:]+).*?LAN2 MAC: ([\w:]+)/s;
  let m;
  if ((m = regex.exec(output)) !== null) {
    // m.forEach((match, groupIndex) => {
    //   debug(`Group ${groupIndex}: ${match.trim()}`);
    //   this[groupIndex] = match.trim();
    // });

    if (m.length !== 8) {
      this.err = 'Can\'t parse Bootloader info, new Model? new Bootloader verison?';
      this.errData = output;
      debug(output);
      return;
    }

    this.modelName = m[1].trim().replace(/\r/g, '').replace(/\u0000/g, '');
    this.bootloaderVersion = m[2].trim();
    this.cpuType = m[3].trim().replace(/\r/g, '').replace(/\u0000/g, '');
    this.bootloaderBuildDate = m[4].trim();
    this.serialNumber = m[5].trim();
    this.MAC1 = m[6].trim();
    this.MAC2 = m[7].trim();
    return;
  }

  this.err = 'Can\'t parse Bootloader info, new Model? new Bootloader verison?';
  this.errData = output;
  debug(output);
  return;
}

async function waitForDevice(serverIP, serverPort) {
  return new Promise((resolve, reject) => {
    const device = {};
    et(
      `${serverIP}:${serverPort}`,
      [
        {expect: 'Press <DEL>', send: `***\n\n`, out: debug},
        {expect: 'Command>>', send: `q\n\n\n\nreset\n`, out: parseDeviceInfo.bind(device)},
      ],
      { timeout: 60 * 1000, exit: false },
      (err) => {
        if (err) return reject(err);
        resolve(device);
      }
    );
  });
}

async function captureDevice(portName) {
  const port = ports[portName];
  ports[portName].device = null;

  port.status = 'WAIT_FOR_DEVICE';
  while(true) {
    debug(JSON.stringify(port));

    try {
      const device = await waitForDevice(port.serverIP, port.serverPort);
      device.portName = port.name;  // set port name to device
      ports[portName].device = device;  // ref device to port
      devices[device.serialNumber] = device;  // save device to store
      debug(ports[portName].device);
    } catch (err) {
      debug(err);
      port.status = 'WAIT_FOR_DEVICE_TIMEOUT';
      continue;
    }

    port.status = 'DEVICE_CAPTURED';
    break;
  }

  return device;
}

module.exports = captureDevice;
