# moxa-image-uploader

Provides an api to to work with the serial server. The server watches to see what devices are hooked up to the serial cables, and provides some apis to discover the devices hooked up. Most importantly it allows you to re-image a device based on serial number.

Available APIs

* GET /devices/:serialNumber
* GET /devices
* GET /ports
* GET /ports/:portName
* POST /image

## Development

```bash
git clone git@github.com:imZack/moxa-image-uploader.git
cd moxa-image-uploader
nvm use # (optional to use common node version)
npm install
```

You can start the server by running:

```bash
npm start
```

Make sure you lint new code before committing.

```bash
npm run lint
```

## Testing

Currently there are no tests.
