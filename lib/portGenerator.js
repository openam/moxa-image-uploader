const debug = require('debug')('moxa-image-uploader:portGenerator');

const ipNumber = '(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)';
const ipRegex = new RegExp(`^${ipNumber}\\.${ipNumber}\\.${ipNumber}\\.${ipNumber}$`);
function verifyValidIP(serverIP) {
  if (!serverIP || !ipRegex.test(serverIP)) {
    throw new Error(`Server IP (${serverIP}) is invalid.`);
  }
}

function verifyPositiveNumber(number, name) {
  const converted = Number(number);
  if (Number.isNaN(converted) || converted < 1) {
    throw new Error(`${name} (${number}) is not a positive number.`);
  }
}

function portGenerator() {
  const serverCount = process.env.SERVER_COUNT || 0;

  if (!serverCount) {
    debug('SERVER_COUNT not found. Not generating ports dynamically');
    return null;
  }

  verifyPositiveNumber(serverCount, 'SERVER_COUNT');

  const ports = [];

  // eslint-disable-next-line no-plusplus
  for (let server = 1; server <= serverCount; server++) {
    const envVariable = `SERVER_${server}`;
    const envValue = process.env[envVariable];

    if (!envValue) {
      throw new Error(`${envVariable} does not exist.`);
    }

    const [serverIP, initialPort, portCount] = envValue.split(',');
    verifyValidIP(serverIP);
    verifyPositiveNumber(initialPort, 'Initial port');
    verifyPositiveNumber(portCount, 'Port count');

    // eslint-disable-next-line no-plusplus
    for (let port = 0; port < portCount; port++) {
      ports.push({
        name: `Server${server}Port${port + 1}`,
        serverIP,
        serverPort: Number(initialPort) + port,
        status: 'INIT',
      });
    }
  }

  return ports;
}

module.exports = portGenerator;
