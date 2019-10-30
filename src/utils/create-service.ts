import * as cors from '@koa/cors';
import * as dotenv from 'dotenv';
import { Server } from 'http';
import * as Koa from 'koa';

dotenv.config();

import { DbModels, DbOptions, Route, ServiceOptions } from '../interfaces';
import * as middleware from '../middleware';
import { connectToDb } from './connect-to-db';

class CodeverosMicro {
  private app = new Koa();
  private routes: Route[];
  private port = 8080;
  private dbOptions: DbOptions;
  private models: DbModels;

  constructor(options?: ServiceOptions) {
    options = options || ({} as ServiceOptions);
    this.routes = options.routes;
    this.dbOptions = options.dbOptions || ({} as DbOptions);
    this.models = options.models || ({} as DbModels);
    this.port = options.port || (process.env.PORT ? parseInt(process.env.PORT, 10) : 8080);
  }

  public start(): Server {
    this.connectToDb();
    this.initializeMiddleware();

    return this.app.listen(this.port, () => {
      console.log(`Listening on ${this.port}`);
    });
  }

  private connectToDb() {
    connectToDb({
      database: process.env.DB_DATABASE,
      host: process.env.DB_HOST,
      pass: process.env.DB_PASS,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
    }).then(() => console.log('connected to database'), (err: Error) => console.error(new Date(), String(err)));
  }

  private initializeMiddleware() {
    this.app.on('error', (err, ctx) => {
      if (err.status === 500) {
        console.error(`Server Error - ${err.stack}`);
      }
    });

    this.app.use(middleware.timer());
    this.app.use(cors());
    this.app.use(middleware.initialize());
    this.app.use(middleware.errorHandler());
    this.app.use(middleware.setModel(this.models));
    this.app.use(middleware.setupHealthCheck());
    this.app.use(middleware.setupApi(this.routes));
  }
}

export function createService(options: ServiceOptions) {
  return new CodeverosMicro(options);
}
