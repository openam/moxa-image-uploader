const debug = require('debug')('moxa-image-uploader:server');
const express = require('express');
const captureDevice = require('./lib/captureDevice');
const uc3100 = require('./lib/uc3100');
const uc8100 = require('./lib/uc8100');
const searchPorts = require('./lib/searchPorts');
const { ports, devices } = require('./lib/store');

function uploadImage(port) {
  const { modelName } = port.device;

  if (/3100|3111/.test(modelName)) {
    return uc3100;
  }

  if (/8100|8112/.test(modelName)) {
    return uc8100;
  }

  return function errorCase() {
    return new Promise((resolve, reject) => {
      reject(new Error('Could not determine model number to use'));
    });
  };
}

const router = express.Router();

router
  .route('/image')
  .post((req, res) => {
    // {
    //   "serialNumber": "TAGGA1001926",
    //   "fileName": "filename.img",
    //   "tftpServerIP": "192.168.127.1",
    //   "tftpDeviceIP": "192.168.127.10",
    //   "timeout": 60,
    //   "rebootToFinish": true,
    //   "webhookUrl": "https://blah.blah.blah"
    // }

    debug(req.body);
    const device = devices[req.body.serialNumber];
    if (!device) return res.sendStatus(404);
    const port = ports[device.portName];
    // TODO: need to verify that the devices is still attached to that port
    if (!port.device || port.device.serialNumber !== device.serialNumber) return res.sendStatus(404);

    port.status = 'UPLOAD_IMAGE_WAITING_FOR_DEVICE';
    port.updatedAt = Date.now();
    uploadImage(port)(
      port.name, req.body.tftpServerIP, req.body.tftpDeviceIP,
      req.body.fileName, req.body.timeout, req.body.rebootToFinish,
    )
      .then(() => {
        port.status = 'UPLOAD_IMAGE_DONE';
        port.updatedAt = Date.now();
      })
      .catch((error) => {
        console.error('Error uploading image', device, port, error);

        const now = Date.now();
        port.status = 'UPLOAD_IMAGE_FAILED';
        port.updatedAt = now;
        device.updatedAt = now;
      })
      .finally(() => {
        // TODO: figure out how to capture rebooted state, but keep on searching
        captureDevice(port.name, device.serialNumber).then(() => {});
      });

    return res.sendStatus(202);
  });

router
  .param('serialNumber', (req, res, next, serialNumber) => {
    if (!devices[serialNumber]) {
      res.sendStatus(404);
    }

    req.device = devices[serialNumber];
    next();
  });

router
  .route('/devices/:serialNumber')
  .get((req, res) => {
    res.json(
      { port: ports[req.device.portName], ...req.device },
    );
  });

router
  .route('/devices')
  .get((req, res) => {
    res.json(
      Object.values(devices).map(
        device => (
          { port: ports[device.portName], ...device }
        ),
      ),
    );
  });

router
  .route('/ports')
  .get((req, res) => {
    res.json(Object.values(ports));
  });

router
  .param('portName', (req, res, next, portName) => {
    if (!ports[portName]) {
      res.sendStatus(404);
    }

    req.port = ports[portName];
    next();
  });

router
  .route('/ports/:portName')
  .get((req, res) => {
    res.json(req.port);
  });

// Keep looking for ports in the background;
setInterval(() => {
  searchPorts();
}, 5000);

// Start web server
const httpPort = process.env.PORT || 8080;
const httpHost = process.env.HOST || '0.0.0.0';
const app = express();
app.use(express.json());
app.use(router);
app.listen(
  httpPort,
  httpHost,
  // eslint-disable-next-line no-console
  () => console.log(`moxa-image-uploader server is listening on port ${httpPort}.`),
);
