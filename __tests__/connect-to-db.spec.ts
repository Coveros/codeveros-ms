import { connectToDb } from '../src/connect-to-db';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as orm from '../src/orm';

describe.skip('Connect To DB', () => {
  let mongod: MongoMemoryServer;

  beforeEach(() => {
    mongod = new MongoMemoryServer();
  });

  afterEach(async () => {
    await orm.connection.close();
    await mongod.stop();
  });

  test('connect with uri', async () => {
    const uri = await mongod.getUri();
    await connectToDb({ uri });
  });

  test('connect with options', async () => {
    const port = await mongod.getPort();
    const database = await mongod.getDbName();
    const host = '127.0.0.1';
    const dbOptions = { port: port.toString(), database, host };
    await connectToDb(dbOptions);
  });
});
