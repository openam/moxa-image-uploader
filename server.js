const captureDevice = require('./lib/captureDevice');
const uploadImage = require('./lib/uc3100');
const debug = require('debug')('moxa-image-uploader:server');
const express = require('express');
const app = express()
const port = process.env.PORT || 8080;

const ports = {
  'Port 1': {
    serverIP: '192.168.127.254',
    serverPort: 4001
  },
  // 'Port 2': {
  //   serverIP: '192.168.127.254',
  //   serverPort: 4002
  // },
  // 'Port 3': {
  //   serverIP: '192.168.127.254',
  //   serverPort: 4003
  // },
  // 'Port 4': {
  //   serverIP: '192.168.127.254',
  //   serverPort: 4004
  // }
};

// {
//   "201903260119": {
//     "serverIP": "192.168.127.254",
//     "serverPort": 4001,
//     "status": "DEVICE_CAPTURED",
//     "device": {
//       "modelName": "UC-3111-T-US-LX",
//       "bootloaderVersion": "1.3.0S04",
//       "cpuType": "1000MHz",
//       "bootloaderBuildDate": "Mar 12 2019 - 13:31:13",
//       "serialNumber": "201903260119",
//       "MAC1": "00:90:E8:00:F9:7E",
//       "MAC2": "00:90:E8:00:F9:7F"
//     }
//   }
// }
const devices = {};
for (let port of Object.values(ports)) {
  port.promise = captureDevice(port.serverIP, port.serverPort)
    .then(function (result) {
      devices[result.device.serialNumber] = result;
    });
}

app.use(express.json());
const router = express.Router();
router
  .route('/image')
  .get(function (req, res) {
    res.json(devices);
  })
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
    if (!device) {
      return res.sendStatus(404);
    }

    device.status = 'UPLOAD_IMAGE_START';
    uploadImage(device.serverIP, device.serverPort, req.body.tftpServerIP, req.body.tftpDeviceIP, req.body.fileName, req.body.timeout, req.body.rebootToFinish)
      .then(() => {
        device.status = 'UPLOAD_IMAGE_DONE';
      })
      .catch(() => {
        device.status = 'UPLOAD_IMAGE_FAILED';
      })
      .finally(() => {
        captureDevice(device.serverIP, device.serverPort)
          .then(function (result) {
            devices[result.device.serialNumber] = result;
          });
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
  .route('/image/:serialNumber')
  .get(function (req, res) {
    res.json(req.device);
  });

app.use(router);

app.listen(port, () => console.log(`moxa-image-uploader server is listening on port ${port}.`));
