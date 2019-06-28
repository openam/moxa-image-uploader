const debug = require('debug')('moxa-image-uploader:index');
const captureDevice = require('./lib/captureDevice');
const uploadImage = require('./lib/uploadImage');
const { ports } = require('./lib/store');
const { devices } = require('./lib/store');

(async () => {
  await (async () => {
    await captureDevice('Port1');
    debug(devices);
  })();

  await (async () => {
    const tftpServerIP = '192.168.127.1';
    const tftpDeviceIP = '192.168.127.200';
    const fileName = 'tftpd32.ini';
    const timeout = 60 * 1000;
    const device = devices['201903260119'];
    if (!device) return;
    const port = ports[device.portName];

    port.status = 'UPLOAD_IMAGE_START';
    debug(device);
    try {
      await uploadImage(
        port.serverIP, port.serverPort, tftpServerIP, tftpDeviceIP, fileName, timeout, true,
      );
      port.status = 'UPLOAD_IMAGE_DONE';
    } catch (err) {
      port.status = 'UPLOAD_IMAGE_FAILED';
      debug(err);
    }

    debug(port);
  })();
})();
