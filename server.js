const captureDevice = require('./lib/captureDevice');
const uploadImage = require('./lib/uc3100');
const debug = require('debug')('moxa-image-uploader:server');
const express = require('express');
const ports = require('./lib/store').ports;
const devices = require('./lib/store').devices;

const router = express.Router();

router
  .route('/image')
  .post(function (req, res) {
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

    port.status = 'UPLOAD_IMAGE_START';
    uploadImage(
        port.serverIP, port.serverPort, req.body.tftpServerIP, req.body.tftpDeviceIP,
        req.body.fileName, req.body.timeout, req.body.rebootToFinish
      )
      .then(() => {
        port.status = 'UPLOAD_IMAGE_DONE';
      })
      .catch(() => {
        port.status = 'UPLOAD_IMAGE_FAILED';
      })
      .finally(() => {
        captureDevice(port.name).then(function (device) {});
      });

    res.sendStatus(202);
  });

router
  .param('serialNumber', function(req, res, next, serialNumber) {
    if (!devices[serialNumber]) {
      res.sendStatus(404);
    }

    res.device = devices[serialNumber];
    next();
  });

router
  .route('/devices/:serialNumber')
  .get(function (req, res) {
    res.json(
      Object.assign(
        { port: ports[req.device.portName] },
        req.device
      )
    );
  });

router
  .route('/devices')
  .get(function (req, res) {
    res.json(devices);
  });

router
  .route('/ports')
  .get(function (req, res) {
    res.json(ports);
  });

router
  .param('portName', function(req, res, next, portName) {
    if (!ports[portName]) {
      res.sendStatus(404);
    }

    res.port = ports[portName];
    next();
  });

router
  .route('/ports/:portName')
  .get(function (req, res) {
    res.json(req.port);
  });

// Open all the ports
for (let port of Object.values(ports)) {
  debug(port);
  port.promise = captureDevice(port.name).then(function (device) {});
}

// Start web server
const httpPort = process.env.PORT || 8080;
const app = express();
app.use(express.json());
app.use(router);
app.listen(
  httpPort,
  () => console.log(`moxa-image-uploader server is listening on port ${httpPort}.`));
