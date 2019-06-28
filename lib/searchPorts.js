// We need to be able to restart the capture of a device if it ends up in a weird state.
// or hasn't received any data in x amount of time.

const debug = require('debug')('moxa-image-uploader:searchPorts');
const { ports } = require('./store');
const captureDevice = require('./captureDevice');
const status = require('./status');

module.exports = function searchPorts() {
  debug('Running through the ports', new Date());

  Object.values(ports).map((port) => {
    debug('%o', port);

    // If the device was captured, and they haven't done anything with it
    // TODO: figure out a variable for the time to start searching again. ENV var or something else?
    if (
      port.status === status.DEVICE_CAPTURED
      && port.updatedAt + (10 * 60 * 1000) < Date.now()
    ) {
      debug(`Time exceeded for ${status.DEVICE_CAPTURED}`, Date.now());
      return captureDevice(port.name);
    }

    // Start searching again if the port is in a specific status
    if (status.RESTART_STATUSES.includes(port.status)) {
      return captureDevice(port.name);
    }

    return null;
  });
};
