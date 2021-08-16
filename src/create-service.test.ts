import * as Koa from 'koa';
import * as cors from '@koa/cors';

import { createService, CodeverosMicro } from '../src/create-service';
import { DbOptions, ServiceOptions } from './interfaces';
import * as orm from './orm';
import { connectToDb } from './connect-to-db';
import { getLogger } from './utils';
import * as middleware from './middleware';

jest.mock('../src/orm');

jest.mock('@koa/cors', () => jest.fn(() => 'cors'));

jest.mock('./utils', () => {
  return {
    __esModule: true,
    getLogger: jest.fn(() => {
      return {
        info: jest.fn(),
        error: jest.fn(),
      };
    }),
  };
});

jest.mock('./middleware', () => {
  return {
    timer: jest.fn(() => 'timer'),
    initialize: jest.fn(() => 'initialize'),
    errorHandler: jest.fn(() => 'errorHandler'),
    setModel: jest.fn(() => 'setModel'),
    setupHealthCheck: jest.fn(() => 'setupHealthCheck'),
    setupApiDocsRoute: jest.fn(() => 'setupApiDocsRoute'),
    setupApi: jest.fn(() => 'setupApi'),
  };
});

const mockKoaOn = jest.fn();
const mockKoaUse = jest.fn();
const mockKoaListen = jest.fn();
jest.mock('koa', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: mockKoaOn,
      use: mockKoaUse,
      listen: mockKoaListen,
    };
  });
});

jest.mock('./connect-to-db');

describe('createService', () => {
  test('returns a CodeverosMicro instance', () => {
    const testService = createService({ routes: [] });
    expect(testService).toBeInstanceOf(CodeverosMicro);
  });
});

describe('CodeverosMicro start', () => {
  const OLD_ENV = process.env;
  let serviceOptions: ServiceOptions;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    mockKoaListen.mockClear();
    mockKoaUse.mockClear();
    mockKoaOn.mockClear();
    serviceOptions = { routes: [] };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('returns the result of Koa.listen()', async () => {
    const mockListenReturn = 'hello I am the this._app.listen() return';
    mockKoaListen.mockReturnValueOnce(mockListenReturn);
    const testService = createService(serviceOptions);
    const app = await testService.start();
    expect(app).toEqual(mockListenReturn);
  });

  test('initiates the middleware in the correct order', async () => {
    const testService = createService(serviceOptions);
    await testService.start();
    expect(mockKoaUse.mock.calls.length).toEqual(8);
    expect(mockKoaUse.mock.calls[0][0]).toEqual('initialize');
    expect(mockKoaUse.mock.calls[1][0]).toEqual('timer');
    expect(mockKoaUse.mock.calls[2][0]).toEqual('cors');
    expect(mockKoaUse.mock.calls[3][0]).toEqual('errorHandler');
    expect(mockKoaUse.mock.calls[4][0]).toEqual('setModel');
    expect(mockKoaUse.mock.calls[5][0]).toEqual('setupHealthCheck');
    expect(mockKoaUse.mock.calls[6][0]).toEqual('setupApiDocsRoute');
    expect(mockKoaUse.mock.calls[7][0]).toEqual('setupApi');
  });

  describe('sets the server port', () => {
    test('to 8080 by default', async () => {
      const testService = createService(serviceOptions);
      await testService.start();
      expect(mockKoaListen).toHaveBeenCalledTimes(1);
      expect(mockKoaListen).toHaveBeenCalledWith(8080, expect.any(Function));
    });

    test('to the port value passed in to createService', async () => {
      const port = 9000;
      const testService = createService({ routes: [], port });
      await testService.start();
      expect(mockKoaListen).toHaveBeenCalledTimes(1);
      expect(mockKoaListen).toHaveBeenCalledWith(port, expect.any(Function));
    });

    test('to the PORT environment variable', async () => {
      const port = 2727;
      process.env.PORT = port.toString();
      const testService = createService(serviceOptions);
      await testService.start();
      expect(mockKoaListen).toHaveBeenCalledWith(port, expect.any(Function));
    });

    test('to the PORT environment variable when a value is also passed in', async () => {
      const port = 6000;
      process.env.PORT = '2727';
      const testService = createService({ routes: [], port });
      await testService.start();
      expect(mockKoaListen).toHaveBeenCalledWith(port, expect.any(Function));
    });
  });

  describe('initiates the setupApiDocsRoute middleware', () => {
    test('with an empty string by default', async () => {
      const testService = createService(serviceOptions);
      await testService.start();
      expect(middleware.setupApiDocsRoute).toHaveBeenCalledWith('');
    });

    test('with the specPath value passed in to createService', async () => {
      serviceOptions.specPath = '/src/path/to/swagger.yaml';
      const testService = createService(serviceOptions);
      await testService.start();
      expect(middleware.setupApiDocsRoute).toHaveBeenCalledWith(serviceOptions.specPath);
    });
  });

  describe('initiates the setModel middleware', () => {
    test('with an empty object by default', async () => {
      const testService = createService(serviceOptions);
      await testService.start();
      expect(middleware.setModel).toHaveBeenCalledWith({});
    });

    test('with the models value passed in to createService', async () => {
      serviceOptions.models = {
        MockModel: {} as jest.MockedClass<typeof orm.Model>,
      };
      const testService = createService(serviceOptions);
      await testService.start();
      expect(middleware.setModel).toHaveBeenCalledWith(serviceOptions.models);
    });
  });

  describe('initiates the setupApi middleware', () => {
    test('with an empty array by default', async () => {
      const testService = createService(serviceOptions);
      await testService.start();
      expect(middleware.setupApi).toHaveBeenCalledWith([]);
    });

    test('with the routes value passed in to createService', async () => {
      serviceOptions.routes = [{ path: '/route-one', action: (ctx: Koa.Context) => 'route-one' }];
      const testService = createService(serviceOptions);
      await testService.start();
      expect(middleware.setupApi).toHaveBeenCalledWith(serviceOptions.routes);
    });
  });

  describe('database connection', () => {
    let defaultDbOptions: DbOptions;
    let host: string;
    let port: string;

    beforeEach(() => {
      defaultDbOptions = {
        database: undefined,
        host: undefined,
        pass: undefined,
        port: '27017',
        user: undefined,
      };

      host = 'localhost';
      port = '5000';

      serviceOptions.dbOptions = { host, port };
    });

    test('is skipped when database options not set', async () => {
      serviceOptions.dbOptions = {};
      const testService = createService(serviceOptions);
      await testService.start();
      expect(connectToDb).not.toHaveBeenCalled();
    });

    test('is executed when uri passed in to createService', async () => {
      const uri = 'abc';
      serviceOptions.dbOptions = { uri };

      const expectedDbOptions = { ...defaultDbOptions, ...{ uri } };

      const testService = createService(serviceOptions);
      await testService.start();
      expect(connectToDb).toHaveBeenCalledWith(expectedDbOptions);
    });

    test('is executed with default port 27017 when dbOptions.host passed in to createService', async () => {
      serviceOptions.dbOptions = { host };

      const expectedDbOptions = { ...defaultDbOptions, ...{ host } };

      const testService = createService(serviceOptions);
      const app = await testService.start();
      expect(connectToDb).toHaveBeenCalledWith(expectedDbOptions);
    });

    test('is executed with dbOptions passed in to createService', async () => {
      const expectedDbOptions = { ...defaultDbOptions, ...{ host, port } };

      const testService = createService(serviceOptions);
      const app = await testService.start();
      expect(connectToDb).toHaveBeenCalledWith(expectedDbOptions);
    });

    test('is executed with dbOptions.port passed in to createService', async () => {
      const expectedDbOptions = { ...defaultDbOptions, ...{ host, port } };

      const testService = createService(serviceOptions);
      const app = await testService.start();
      expect(connectToDb).toHaveBeenCalledWith(expectedDbOptions);
    });

    test('is executed with DB_DATABASE environment variable as database value', async () => {
      process.env.DB_DATABASE = 'the_database';
      const expectedDbOptions = { ...defaultDbOptions, ...{ host, port, database: 'the_database' } };

      const testService = createService(serviceOptions);
      await testService.start();
      expect(connectToDb).toHaveBeenCalledWith(expectedDbOptions);
    });

    test('is executed with DB_HOST environment variable as host value', async () => {
      process.env.DB_HOST = 'the_db_host';
      serviceOptions.dbOptions = {};
      const expectedDbOptions = { ...defaultDbOptions, ...{ host: 'the_db_host' } };

      const testService = createService(serviceOptions);
      await testService.start();
      expect(connectToDb).toHaveBeenCalledWith(expectedDbOptions);
    });

    test('is executed with DB_PASS environment variable as pass value', async () => {
      process.env.DB_PASS = 'the_db_password';
      const expectedDbOptions = { ...defaultDbOptions, ...{ host, port, pass: 'the_db_password' } };

      const testService = createService(serviceOptions);
      await testService.start();
      expect(connectToDb).toHaveBeenCalledWith(expectedDbOptions);
    });

    test('is executed with DB_PORT environment variable as port value', async () => {
      process.env.DB_PORT = '2727';
      serviceOptions.dbOptions = { host };
      const expectedDbOptions = { ...defaultDbOptions, ...{ host, port: '2727' } };

      const testService = createService(serviceOptions);
      await testService.start();
      expect(connectToDb).toHaveBeenCalledWith(expectedDbOptions);
    });

    test('is executed with DB_USER environment variable as dbOptions user value', async () => {
      process.env.DB_USER = 'the_user';
      const expectedDbOptions = { ...defaultDbOptions, ...{ host, port, user: 'the_user' } };

      const testService = createService(serviceOptions);
      await testService.start();
      expect(connectToDb).toHaveBeenCalledWith(expectedDbOptions);
    });

    test('is executed with dbOptions input to createService when environment variables also set', async () => {
      const dbOptions: DbOptions = {
        database: 'database',
        host: 'localhost',
        pass: 'password',
        port: '10000',
        user: 'admin',
        uri: 'this-is-a-uri-string',
      };

      serviceOptions.dbOptions = dbOptions;

      process.env.DB_DATABASE = 'DB_DATABASE';
      process.env.DB_HOST = 'DB_HOST';
      process.env.DB_PASS = 'DB_PASS';
      process.env.DB_PORT = '5000';
      process.env.DB_USER = 'DB_USER';

      const testService = createService(serviceOptions);
      await testService.start();
      expect(connectToDb).toHaveBeenCalledWith(dbOptions);
    });
  });
});
