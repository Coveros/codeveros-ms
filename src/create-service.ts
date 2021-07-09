import * as cors from '@koa/cors';
import * as dotenv from 'dotenv';
import { Server } from 'http';
import * as Koa from 'koa';

dotenv.config();

import { connectToDb } from './connect-to-db';
import { DbModels, DbOptions, Route, ServiceOptions } from './interfaces';
import * as middleware from './middleware';
import * as orm from './orm';
import { getLogger } from './utils';

export class CodeverosMicro {
  private _app = new Koa();
  private _routes: Route[];
  private _port = 8080;
  private _dbOptions: DbOptions;
  private _models: DbModels;
  private _specPath: string;

  constructor(options?: ServiceOptions) {
    options = options || ({} as ServiceOptions);

    const envDbOptions: DbOptions = {
      database: process.env.DB_DATABASE,
      host: process.env.DB_HOST,
      pass: process.env.DB_PASS,
      port: process.env.DB_PORT || '27017',
      user: process.env.DB_USER,
    };

    this._specPath = options.specPath || '';
    this._routes = options.routes;
    this._dbOptions = { ...envDbOptions, ...(options.dbOptions || {}) };
    this._models = options.models || ({} as DbModels);
    this._port = options.port || (process.env.PORT ? parseInt(process.env.PORT, 10) : 8080);
  }

  public async start(): Promise<Server> {
    const logger = getLogger();

    if (!this._dbOptions.uri && !(this._dbOptions.host && this._dbOptions.port)) {
      logger.info('Skipping database connection because necessary configuration not provided');
    } else {
      await this.connectToDb();
    }
    this.initializeMiddleware();

    return this._app.listen(this._port, () => {
      logger.info(`Listening on ${this._port}`);
    });
  }

  get app(): Koa {
    return this._app;
  }

  get port(): number {
    return this._port;
  }

  get routes(): Route[] {
    return this._routes;
  }

  get dbOptions(): DbOptions {
    return this._dbOptions;
  }

  get models(): DbModels {
    return this._models;
  }

  get specPath(): string {
    return this._specPath;
  }

  private async connectToDb() {
    const logger = getLogger();
    try {
      await connectToDb(this._dbOptions);
    } catch (err: any) {
      logger.error('Error connecting to the db: ', err);
    }
  }

  private initializeMiddleware() {
    this._app.on('error', (err: any, ctx) => {
      const logger = getLogger();
      if (err instanceof orm.Error.ValidationError || err.status === 401) {
        logger.info('Validation or 401 Error thrown: ', err);
      } else {
        logger.error(`Server Error - ${err.stack}`);
      }
    });

    this._app.use(middleware.initialize());
    this._app.use(middleware.timer());
    this._app.use(cors());
    this._app.use(middleware.errorHandler());
    this._app.use(middleware.setModel(this._models));
    this._app.use(middleware.setupHealthCheck());
    this._app.use(middleware.setupApiDocsRoute(this._specPath));
    this._app.use(middleware.setupApi(this._routes));
  }
}

export function createService(options: ServiceOptions) {
  return new CodeverosMicro(options);
}
