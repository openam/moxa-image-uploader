const { expect } = require('chai');
const portGenerator = require('../lib/portGenerator');

describe('portGenerator', () => {
  beforeEach(() => {
    process.env.SERVER_COUNT = 1;
    process.env.SERVER_1 = '192.168.127.254,4001,4';
  });

  it('should return undefined with no env variables', () => {
    delete process.env.SERVER_COUNT;

    const result = portGenerator();
    expect(result).to.equal(null);
  });

  it('should throw error on invalid sever count', () => {
    process.env.SERVER_COUNT = 'a';
    expect(() => portGenerator()).to.throw('SERVER_COUNT (a) is not a positive number.');
  });

  it('should throw error when SERVER_COUNT === 1 without SERVER_1', () => {
    delete process.env.SERVER_1;
    expect(() => portGenerator()).to.throw('SERVER_1 does not exist');
  });

  it('should throw error in invalid server ip', () => {
    process.env.SERVER_1 = '999.999.999.999,4001,4';
    expect(() => portGenerator()).to.throw('Server IP (999.999.999.999) is invalid.');
  });

  it('should throw error on invalid initial port', () => {
    process.env.SERVER_1 = '192.168.127.254,foobar,4';
    expect(() => portGenerator()).to.throw('Initial port (foobar) is not a positive number.');

    process.env.SERVER_1 = '192.168.127.254,0,4';
    expect(() => portGenerator()).to.throw('Initial port (0) is not a positive number.');
  });

  it('should throw error on invalid port count', () => {
    process.env.SERVER_1 = '192.168.127.254,4001,count';
    expect(() => portGenerator()).to.throw('Port count (count) is not a positive number.');

    process.env.SERVER_1 = '192.168.127.254,4001,0';
    expect(() => portGenerator()).to.throw('Port count (0) is not a positive number.');
  });
});
