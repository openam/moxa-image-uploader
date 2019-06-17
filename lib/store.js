const portGenerator = require('./portGenerator');
const portDefaults = require('./portDefaults');

const ports = (portGenerator() || portDefaults).reduce((acc, current) => {
  acc[current.name] = current;

  return acc;
}, {});

module.exports = {
  ports,
  devices: {},
};
