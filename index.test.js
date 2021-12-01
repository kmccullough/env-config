const loadConfig = require('./index');

const assert = require('assert');

describe('Unit | loadConfig', function() {
  it('should be default and named export', function() {
    assert.ok(loadConfig);
    assert.strictEqual(loadConfig, loadConfig.loadConfig);
  });

  it('should load environment config', function() {
    const result = loadConfig('test-config-file1.env');
    assert.deepEqual(result, {
      ABC: '123',
      REPLACE: '01234',
    });
  });

  it('should load environment', function() {
    const result = loadConfig([ 'test-config-file1.env', 'test-config-file2.env' ]);
    assert.deepEqual(result, {
      ABC: '321',
      REPLACE: '43210',
    });
  });
});
