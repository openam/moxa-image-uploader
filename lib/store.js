const portGenerator = require('./portGenerator');
const portDefaults = require('./portDefaults');
const status = require('./status');

const ports = (portGenerator() || portDefaults).reduce((acc, current) => {
  acc[current.name] = current;
  acc[current.name].status = status.INIT;

  return acc;
}, {});

module.exports = {
  ports,
  devices: {},
};
