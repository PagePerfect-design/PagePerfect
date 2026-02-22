'use strict';

const log = require('../logger');

describe('logger', () => {
  test('exports a pino logger instance', () => {
    expect(log).toBeDefined();
    expect(typeof log.info).toBe('function');
    expect(typeof log.error).toBe('function');
    expect(typeof log.warn).toBe('function');
    expect(typeof log.debug).toBe('function');
  });

  test('can create child loggers', () => {
    const child = log.child({ module: 'test' });
    expect(child).toBeDefined();
    expect(typeof child.info).toBe('function');
  });

  test('has service base field', () => {
    // The bindings should include our base config
    const bindings = log.bindings();
    expect(bindings.service).toBe('pageperfect-api');
  });
});
