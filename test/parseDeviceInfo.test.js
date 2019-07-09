const { expect } = require('chai');
const fs = require('fs');
const parseDeviceInfo = require('../lib/parseDeviceInfo');

describe('parseDeviceInfo', () => {
  let result;

  beforeEach(() => {
    result = {};
  });

  it('should capture UC-8100 Boot Loader 1.2.16C00', () => {
    parseDeviceInfo(result)(fs.readFileSync(`${__dirname}/fixtures/8100/1.2.16C00.telnet`));

    expect(result).to.have.property('modelName', 'UC-8100-ME');
    expect(result).to.have.property('bootloaderVersion', '1.2.16C00');
    expect(result).to.have.property('cpuType', '1GHz');
    expect(result).to.have.property('bootloaderBuildDate', 'Oct  6 2017 - 08:54:02');
    expect(result).to.have.property('serialNumber', 'IMOXA1234567');
    expect(result).to.have.property('MAC1', '00:90:e8:00:00:40');
    expect(result).to.have.property('MAC2', '00:90:e8:00:00:50');
  });

  it('should capture UC-8100 Boot Loader 1.2.0S00', () => {
    parseDeviceInfo(result)(fs.readFileSync(`${__dirname}/fixtures/8100/1.2.0S00.telnet`));

    expect(result).to.have.property('modelName', 'UC-8100-ME');
    expect(result).to.have.property('bootloaderVersion', '1.2.0S00');
    expect(result).to.have.property('cpuType', '1GHz');
    expect(result).to.have.property('bootloaderBuildDate', 'Feb  8 2018 - 00:39:34');
    expect(result).to.have.property('serialNumber', '201601201034');
    expect(result).to.have.property('MAC1', '00:90:e8:00:eb:8a');
    expect(result).to.have.property('MAC2', '00:90:e8:00:eb:8b');
  });

  it('should capture UC-8100 Boot Loader 1.4.2C04', () => {
    parseDeviceInfo(result)(fs.readFileSync(`${__dirname}/fixtures/8100/1.4.2C04.telnet`));

    expect(result).to.have.property('modelName', 'UC-8112-LX (VS)');
    expect(result).to.have.property('bootloaderVersion', '1.4.2C04');
    expect(result).to.have.property('cpuType', '1GHz');
    expect(result).to.have.property('bootloaderBuildDate', 'Jun 28 2018 - 15:37:29');
    expect(result).to.have.property('serialNumber', 'TAIBB1103828');
    expect(result).to.have.property('MAC1', '00:90:E8:78:E0:E6');
    expect(result).to.have.property('MAC2', '00:90:E8:78:E0:E7');
  });

  it('should capture UC-3100 Boot Loader 1.3.0S02', () => {
    parseDeviceInfo(result)(fs.readFileSync(`${__dirname}/fixtures/3100/1.3.0S02.telnet`));

    expect(result).to.have.property('modelName', 'UC-3111-LX');
    expect(result).to.have.property('bootloaderVersion', '1.3.0S02');
    expect(result).to.have.property('cpuType', '1000MHz');
    expect(result).to.have.property('bootloaderBuildDate', 'Feb 11 2019 - 12:09:11');
    expect(result).to.have.property('serialNumber', '201902260086');
    expect(result).to.have.property('MAC1', '00:90:E8:00:F9:3C');
    expect(result).to.have.property('MAC2', '00:90:E8:00:F9:3D');
  });
});
