const debug = require('debug')('moxa-image-uploader:index');
const captureDevice = require('./lib/captureDevice');
const uploadImage = require('./lib/uc3100');

(async () => {
  const devices = {};
  await (async () => {
    const serverIP = '192.168.127.254';
    const serverPort = 4001;
    const instance = await captureDevice(serverIP, serverPort);
    devices[instance.device.serialNumber] = instance;
    debug(instance);
  })();

  await (async () => {
    const tftpServerIP = '192.168.127.1';
    const tftpDeviceIP = '192.168.127.200';
    const fileName = 'tftpd32.ini';
    const timeout = 60 * 1000;
    const instance = devices['201903260119'];
    if (!instance) {
      return;
    }

    instance.status = 'UPLOAD_IMAGE_START';
    debug(instance);
    try {
      await uploadImage(instance.serverIP, instance.serverPort, tftpServerIP, tftpDeviceIP, fileName, timeout, true);
      instance.status = 'UPLOAD_IMAGE_DONE';
    } catch (err) {
      instance.status = 'UPLOAD_IMAGE_FAILED';
      debug(err);
    }

    debug(instance);
  })();
})();
