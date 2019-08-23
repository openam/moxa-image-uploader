const debug = require('debug')('moxa-image-uploader:server');
const express = require('express');
const getModelUploader = require('./lib/getModelUploader');
const searchPorts = require('./lib/searchPorts');
const { ports, devices } = require('./lib/store');
const status = require('./lib/status');

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
    if (!port.device || port.device.serialNumber !== device.serialNumber) {
      return res.sendStatus(404);
    }

    port.status = status.UPLOAD_IMAGE_WAITING_FOR_DEVICE;
    port.updatedAt = Date.now();
    try {
      const modelUploader = getModelUploader(port);

      modelUploader(
        port.name, req.body.tftpServerIP, req.body.tftpDeviceIP,
        req.body.fileName, req.body.timeout, req.body.rebootToFinish,
      )
        .then(() => {
          port.status = status.UPLOAD_IMAGE_DONE;
          port.updatedAt = Date.now();
        })
        .catch((error) => {
          debug('Error uploading image', device, port, error);
          const now = Date.now();
          port.status = status.UPLOAD_IMAGE_FAILED;
          port.updatedAt = now;
          device.updatedAt = now;
        });

      return res.sendStatus(202);
    } catch (error) {
      debug('Error uploading image', device, port, error);
      return res.sendStatus(500);
    }
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
