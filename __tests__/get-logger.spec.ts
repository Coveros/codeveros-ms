import * as winston from 'winston';
import { getLogger } from '../src/utils/get-logger';

describe('Get Logger', () => {
  const loggerId = 'default';

  afterEach(() => {
    winston.loggers.close(loggerId);
  });

  test('Should return a logger', () => {
    const logger = getLogger(loggerId);
    expect(logger).toHaveProperty('info');
    expect(logger).toHaveProperty('error');
    expect(logger).toHaveProperty('verbose');
  });

  test('Should set the default log level to info', () => {
    const logger = getLogger(loggerId);
    expect(logger.level).toEqual('info');
  });

  test('Should allow setting the log level', () => {
    const level = 'verbose';
    const logger = getLogger(loggerId, { level });
    expect(logger.level).toEqual(level);
  });
});
