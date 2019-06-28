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

    // If the device rebooted we need to start looking again for when they unplug the device
    if (status.RESTART_STATUSES.includes(port.status)) {
      return captureDevice(port.name);
    }

    // TODO: what happens if they boot before the serial cable is plugged in?
    //       I don't think we can do anything about this.
    // TODO: what happens if we capture the device, but don't do anything for a while?
    //       Should we start searching again incase they pulled it off?

    return null;
  });
};
