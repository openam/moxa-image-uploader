const et = require('expect-telnet');
const debug = require('debug')('moxa-image-uploader:captureDevice');
const { ports, devices } = require('./store');
const parseDeviceInfo = require('./parseDeviceInfo');
const status = require('./status');

async function waitForDevice(serverIP, serverPort) {
  return new Promise((resolve, reject) => {
    const device = {};
    et(
      `${serverIP}:${serverPort}`,
      [
        { expect: 'Press <DEL>', send: '***\n\n', out: debug },
        { expect: 'Command>>', send: 'q\n\n\n\nreset\n', out: parseDeviceInfo(device) },
      ],
      { timeout: 60 * 1000, exit: false },
      (err) => {
        if (err) return reject(err);
        return resolve(device);
      },
    );
  });
}

async function captureDevice(portName, serialNumber) {
  const port = ports[portName];
  if (!serialNumber) {
    ports[portName].device = null;
    port.status = status.WAIT_FOR_DEVICE;
  }

  port.updatedAt = Date.now();
  let device;
  while (!device) {
    debug(JSON.stringify(port));
    try {
      // eslint-disable-next-line no-await-in-loop
      device = await waitForDevice(port.serverIP, port.serverPort);
      device.portName = port.name; // set port name to device
      ports[portName].device = device; // ref device to port
      devices[device.serialNumber] = device; // save device to store
      debug(ports[portName].device);
      port.status = serialNumber ? status.UPLOAD_IMAGE_REBOOTED : status.DEVICE_CAPTURED;
      port.updatedAt = Date.now();
      break;
    } catch (err) {
      debug(err);
      port.status = 'WAIT_FOR_DEVICE_TIMEOUT';
      port.updatedAt = Date.now();
    }
  }

  return device;
}

module.exports = captureDevice;
