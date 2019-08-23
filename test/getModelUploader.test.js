const { expect } = require('chai');
const getModelUploader = require('../lib/getModelUploader');
const uc3100v1 = require('../lib/models/uc3100-v1');
const uc3100v2 = require('../lib/models/uc3100-v2');
const uc8100 = require('../lib/models/uc8100');

describe('getModelUploader', () => {
  let device;

  beforeEach(() => {
    device = {
      modelName: 'UC-3111-LX',
      bootloaderVersion: '1.3.0S06',
    };
  });

  it('should throw an error if the using an custom bootloader', () => {
    device.bootloaderVersion = '1.3.0C06';
    expect(() => getModelUploader({ device })).to.throw('Incompatible version checks 1.3.0C06 vs 1.3.0S07');
  });

  it('should throw an error if it cannot determine model number', () => {
    device.modelName = 'FakeModel';
    expect(() => getModelUploader({ device })).to.throw('Could not determine model number to use');
  });

  it('should return the uc3100-v1 if bootloader is old', () => {
    const version = getModelUploader({ device });
    expect(version).to.equal(uc3100v1);
  });

  it('should return the uc3100-v2 if bootloader is equal', () => {
    device.bootloaderVersion = '1.3.0S07';
    const version = getModelUploader({ device });
    expect(version).to.equal(uc3100v2);
  });

  it('should return the uc3100-v2 if the bootloader is new', () => {
    device.bootloaderVersion = '1.4.0S01';
    const version = getModelUploader({ device });
    expect(version).to.equal(uc3100v2);
  });

  it('should return the uc8100', () => {
    device.modelName = 'UC-8100-ME';
    const version = getModelUploader({ device });
    expect(version).to.equal(uc8100);
  });
});
