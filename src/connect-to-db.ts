import { DbOptions } from './interfaces';
import * as orm from './orm';
import type { ConnectOptions } from './orm';
import { getLogger } from './utils/get-logger';

const logger = getLogger();
const timeout = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function connect(uri: string, options: ConnectOptions): Promise<void> {
  try {
    await orm.connect(uri, options);
    logger.info('Connected to database');
  } catch (err) {
    if (err instanceof Error) {
      logger.error(`Failed to connect to db on initial attempt: ${err.name}, ${err.message}`);
    }
    // Wait for a bit, then try to connect again
    await timeout(5000);
    logger.info('Retrying initial connect...');
    await connect(uri, options);
  }
}

export function connectToDb(dbOptions: DbOptions) {
  logger.info('Connecting to database...');

  const options: ConnectOptions = {
    maxPoolSize: 5,
  };

  if (dbOptions.database) {
    options.dbName = dbOptions.database;
  }

  if (dbOptions.user) {
    options.user = dbOptions.user;
  }

  if (dbOptions.pass) {
    options.pass = dbOptions.pass;
  }

  const uri = dbOptions.uri || `mongodb://${dbOptions.host}:${dbOptions.port}`;
  return connect(uri, options);
}
