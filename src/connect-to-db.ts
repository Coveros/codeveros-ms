import { DbOptions } from './interfaces';

import * as mongoose from 'mongoose';

const timeout = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function connect(uri: string): Promise<void> {
  const options = {
    poolSize: 5,
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  try {
    await mongoose.connect(uri, options);
  } catch (err) {
    if (err.message && err.message.match(/failed to connect to server .* on first connect/)) {
      console.log(new Date(), String(err));
      // Wait for a bit, then try to connect again
      await timeout(10000);
      console.log('Retrying first connect...');
      await connect(uri);
    } else {
      throw err;
    }
  }
}

export function connectToDb(options: DbOptions = {}) {
  const { host = 'localhost', port = '27017', database = 'myapp' } = options;
  const authPart = options.user ? `${options.user}:${options.pass}@` : '';
  const uri = options.uri || `mongodb://${authPart}${host}:${port}/${database}`;
  return connect(uri);
}
