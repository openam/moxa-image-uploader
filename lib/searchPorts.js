// We need to be able to restart the capture of a device if it ends up in a weird state.
// or hasn't received any data in x amount of time.

const debug = require('debug')('moxa-image-uploader:searchPorts');
const { ports } = require('./store');
const captureDevice = require('./captureDevice');
const status = require('./status');

module.exprots = function searchPorts() {
  debug('Running through the ports', new Date());

  Object.values(ports).map((port) => {
    debug(port);

    // If there isn't a device it's the initial start, and needs to start finding one.
    // We also don't want to restart if it's already waiting for a device
    if (!port.device && port.status !== status.WAIT_FOR_DEVICE) {
      return captureDevice(port.name);
    }

    // If in UPLOAD_IMAGE_ENTERED_BIOS for > 30 seconds start searching again.
    // It should move to UPLOAD_IMAGE_START pretty quickly
    if (port.status === status.UPLOAD_IMAGE_ENTERED_BIOS && port.updatedAt + 30 > Date.now()) {
      debug(`Time exceeded for ${status.UPLOAD_IMAGE_ENTERED_BIOS}`);
      return captureDevice(port.name);
    }

    // If in UPLOAD_IMAGE_START for > some timeout start searching.
    // The re-imaging may take about 10 minutes
    // TODO: need to determine how to get time out from the users payload.
    const HARD_CODED_TIMEOUT = 15 * 60 * 1000;
    if (
      port.status === status.UPLOAD_IMAGE_START
      && port.updatedAt + HARD_CODED_TIMEOUT > Date.now()
    ) {
      debug(`Time exceeded for ${status.UPLOAD_IMAGE_START}`);
      return captureDevice(port.name);
    }

    // If the device rebooted we need to start looking again for when they unplug the device
    if (port.status === status.UPLOAD_IMAGE_REBOOTED) {
      return captureDevice(port.name);
    }

    // TODO: what happens if they boot before the serial cable is plugged in? I don't think we can do anything about this.
    // TODO: what happens if we capture the device, but don't do anything for a while? Should we start searching again incase they pulled it off?

    return null;
  });
};
