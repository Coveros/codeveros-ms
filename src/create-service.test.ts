import { createService, CodeverosMicro } from '../src/create-service';
import { DbOptions, Route } from '../src/interfaces';
import { Context } from 'koa';
import { DbModels, ServiceOptions } from '../lib/interfaces';
import * as orm from '../src/orm';
import * as Koa from 'koa';
import { connectToDb } from './connect-to-db';
import { getLogger } from './utils';

jest.mock('./utils', () => {
  return {
    __esModule: true,
    getLogger: jest.fn(() => {
      return {
        info: jest.fn(),
        error: jest.fn()
      }
    })
  }
});


const mockKoaOn = jest.fn();
const mockKoaUse = jest.fn();
const mockKoaListen = jest.fn();
jest.mock('koa', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: mockKoaOn, use: mockKoaUse, listen: mockKoaListen
    }
  })
});

jest.mock('./connect-to-db');

describe('Create CodeverosMicro Service', () => {
  describe('With Default Options', () => {
    let testService: CodeverosMicro;

    beforeEach(() => {
      testService = createService({ routes: [] });
    });

    test('Default port is 8080', () => {
      expect(testService.port).toEqual(8080);
    });

    test('Default specPath', () => {
      expect(testService.specPath).toEqual('');
    });

    test('Default DbOptions', () => {
      const expected: DbOptions = {
        database: undefined,
        host: undefined,
        pass: undefined,
        port: '27017',
        user: undefined
      }

      expect(testService.dbOptions).toEqual(expected);
    });

    test('Default models', () => {
      expect(testService.models).toEqual({});
    });

    test('Routes is empty array', () => {
      expect(testService.routes).toEqual([])
    });

  });

  describe('With createService options', () => {
    test('Set specPath', () => {
      const specPath = '/src/path/to/swagger.yaml';
      const testService = createService({ routes: [], specPath });
      expect(testService.specPath).toEqual(specPath);
    });

    test('Set Routes', () => {
      const routes: Route[] = [
        { path: '/route-one', action: (ctx: Context) => 'route-one' }
      ];
      const testService = createService({ routes });
      expect(testService.routes).toEqual(routes);
    });

    test('Set Models', () => {
      const modelSchema = new orm.Schema({ name: 'string' });
      const models: DbModels = {
        'model-one': orm.model('ModelOne', modelSchema)
      };
      const testService = createService({ routes: [], models });
      expect(testService.models).toEqual(models);
    });

    test('Set Port', () => {
      const port = 9090;
      const testService = createService({ routes: [], port });
      expect(testService.port).toEqual(port);
    })

    test('Set DbOptions', () => {
      const dbOptions: DbOptions = {
        database: 'database',
        host: 'localhost',
        pass: 'password',
        port: '10000',
        user: 'admin',
        uri: 'this-is-a-uri-string'
      };

      const testService = createService({ routes: [], dbOptions });
    });
  });

  describe('With Environment Variable Configuration', () => {
    const OLD_ENV = process.env;
    const serviceOptions = { routes: [] };

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...OLD_ENV };
    });

    afterAll(() => {
      process.env = OLD_ENV;
    });

    test('set database with DB_DATABASE environment variable', () => {
      const actual = 'the_database';
      process.env.DB_DATABASE = actual;
      const testService = createService(serviceOptions);
      expect(testService.dbOptions.database).toEqual(actual);
    });

    test('set host with DB_HOST environment variable', () => {
      const actual = 'the_db_host';
      process.env.DB_HOST = actual;
      const testService = createService(serviceOptions);
      expect(testService.dbOptions.host).toEqual(actual);
    });

    test('set db password with DB_PASS environment variable', () => {
      const actual = 'the_db_password';
      process.env.DB_PASS = actual;
      const testService = createService(serviceOptions);
      expect(testService.dbOptions.pass).toEqual(actual);
    });

    test('set db port with DB_PORT environment variable', () => {
      const actual = '2727';
      process.env.DB_PORT = actual;
      const testService = createService(serviceOptions);
      expect(testService.dbOptions.port).toEqual(actual);
    });

    test('set db user with DB_USER environment variable', () => {
      const actual = 'the_user';
      process.env.DB_USER = actual;
      const testService = createService(serviceOptions);
      expect(testService.dbOptions.user).toEqual(actual);
    });

    test('createService dbOptions input takes precedence over environment variables', () => {
      const dbOptions: DbOptions = {
        database: 'database',
        host: 'localhost',
        pass: 'password',
        port: '10000',
        user: 'admin',
        uri: 'this-is-a-uri-string'
      };

      process.env.DB_DATABASE = 'DB_DATABASE';
      process.env.DB_HOST = 'DB_HOST';
      process.env.DB_PASS = 'DB_PASS';
      process.env.DB_PORT = '5000';
      process.env.DB_USER = 'DB_USER';

      const testService = createService({ routes: [], dbOptions });
      expect(testService.dbOptions).toEqual(dbOptions);
    });

    test('set service port with PORT environment variable (converted to integer)', () => {
      const actual = 2727;
      process.env.PORT = actual.toString();
      const testService = createService(serviceOptions);
      expect(testService.port).toEqual(actual);
    });

    test('createService port input takes precedence over PORT environment variable', () => {
      const actual = 6000;
      process.env.PORT = '2727';
      const testService = createService({ routes: [], port: actual });
      expect(testService.port).toEqual(actual);
    });


  });
});

describe('Start Service', () => {
  let testService: CodeverosMicro;
  let serviceOptions: ServiceOptions;

  beforeEach(() => {
    serviceOptions = { routes: [] };
    mockKoaUse.mockClear();
    mockKoaListen.mockClear();
  });

  test('do not connect to db when database options not present', async () => {
    const testService = createService(serviceOptions);
    const app = await testService.start();
    expect(connectToDb).not.toHaveBeenCalled();
  });

  test('connect to db when database uri', async () => {
    serviceOptions.dbOptions = {uri: 'abc'};
    const testService = createService(serviceOptions);
    const app = await testService.start();
    expect(connectToDb).toHaveBeenCalledWith(testService.dbOptions);
  });

  test('connect to db when database host and port present', async () => {
    serviceOptions.dbOptions = {host: 'localhost', port: '5000'};
    const testService = createService(serviceOptions);
    const app = await testService.start();
    expect(connectToDb).toHaveBeenCalledWith(testService.dbOptions);
  });

  test('connect to db when just database host present', async () => {
    serviceOptions.dbOptions = {host: 'localhost'};
    const testService = createService(serviceOptions);
    const app = await testService.start();
    expect(connectToDb).toHaveBeenCalledWith(testService.dbOptions);
  });

  describe('Initializing Middleware', () => {
    test('the expected number of middleware are executed during start', async () => {
      const testService = createService(serviceOptions);
      const app = await testService.start();
      expect(mockKoaUse.mock.calls.length).toEqual(8);
    });
  });


  test('call listen on the app using configured port', async () => {
    const testService = createService(serviceOptions);
    const app = await testService.start();
    expect(mockKoaListen).toHaveBeenCalled();
  });

  test('start should return the result of listen', async () => {
    const mockListenReturn = 'hello I am the this._app.listen() return';
    mockKoaListen.mockReturnValueOnce(mockListenReturn);
    const testService = createService(serviceOptions);
    const app = await testService.start();
    expect(app).toEqual(mockListenReturn);
  });
});
