import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectToDb } from './connect-to-db';
import * as orm from './orm';

describe('Connect To DB', () => {
  let mongod: MongoMemoryServer;

  beforeEach(async () => {
    mongod = await MongoMemoryServer.create();
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
    const port = mongod.instanceInfo?.port || '';
    const database = mongod.instanceInfo?.dbName;
    const host = '127.0.0.1';
    const dbOptions = { port: port.toString(), database, host };
    await connectToDb(dbOptions);
  });
});
