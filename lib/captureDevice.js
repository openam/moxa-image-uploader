const et = require('expect-telnet');
const debug = require('debug')('moxa-image-uploader:captureDevice');
const { ports, devices } = require('./store');
const parseDeviceInfo = require('./parseDeviceInfo');

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

async function captureDevice(portName) {
  const port = ports[portName];
  ports[portName].device = null;

  port.status = 'WAIT_FOR_DEVICE';
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
      port.status = 'DEVICE_CAPTURED';
      break;
    } catch (err) {
      debug(err);
      port.status = 'WAIT_FOR_DEVICE_TIMEOUT';
    }
  }

  return device;
}

module.exports = captureDevice;
