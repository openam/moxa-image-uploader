const { expect } = require('chai');
const compareVersions = require('../lib/compareVersions');

describe('compareVersions', () => {
  it('should throw error if comparing standard and custom versions', () => {
    const checking = '1.3.0S07';
    const baseline = '1.3.0C07';
    expect(() => compareVersions(checking, baseline)).to.throw(`Incompatible version checks ${checking} vs ${baseline}`);
  });

  it('should throw error if different amount of pieces', () => {
    const checking = '1.3.0S07';
    const baseline = '1.3.0.0S04';
    expect(() => compareVersions(checking, baseline)).to.throw(`Different version formats ${checking} vs ${baseline}`);
  });

  it('should compare simple semver', () => {
    expect(compareVersions('1.0.0', '1.0.0')).to.equal(0);
    expect(compareVersions('1.0.1', '1.0.0')).to.equal(1);
    expect(compareVersions('1.1.0', '1.0.0')).to.equal(1);
    expect(compareVersions('2.0.0', '1.0.0')).to.equal(1);
    expect(compareVersions('1.1.1', '2.0.0')).to.equal(-1);
  });

  it('should compare standard bootloader', () => {
    expect(compareVersions('1.3.0S08', '1.3.0S07')).to.equal(1);
    expect(compareVersions('1.3.0S06', '1.3.0S06')).to.equal(0);
    expect(compareVersions('1.3.0S06', '1.3.0S07')).to.equal(-1);
  });


  it('should compare custom bootloader', () => {
    expect(compareVersions('1.3.0C08', '1.3.0C07')).to.equal(1);
    expect(compareVersions('1.3.0C06', '1.3.0C06')).to.equal(0);
    expect(compareVersions('1.3.0C06', '1.3.0C07')).to.equal(-1);
  });

  it('should return 1 for versions that are >', () => {
    expect(compareVersions('1.3.1S07', '1.3.0S07')).to.equal(1);
    expect(compareVersions('1.4.0S07', '1.3.0S07')).to.equal(1);
    expect(compareVersions('2.3.0S07', '1.3.0S07')).to.equal(1);
    expect(compareVersions('1.0.1', '1.0.0')).to.equal(1);
    expect(compareVersions('1.1.0', '1.0.0')).to.equal(1);
    expect(compareVersions('2.0.0', '1.0.0')).to.equal(1);
  });

  it('should return 0 for versions that are =', () => {
    expect(compareVersions('1.3.0C06', '1.3.0C06')).to.equal(0);
    expect(compareVersions('1.3.0S06', '1.3.0S06')).to.equal(0);
    expect(compareVersions('1.3.6', '1.3.6')).to.equal(0);
  });

  it('should return -1 for versions that are <', () => {
    expect(compareVersions('1.3.0S07', '1.4.0S07')).to.equal(-1);
    expect(compareVersions('1.3.0S07', '1.3.1S07')).to.equal(-1);
    expect(compareVersions('1.3.0S07', '2.3.0S07')).to.equal(-1);
    expect(compareVersions('1.0.0', '1.0.1')).to.equal(-1);
    expect(compareVersions('1.0.0', '1.1.0')).to.equal(-1);
    expect(compareVersions('1.0.0', '2.0.0')).to.equal(-1);
  });
});
