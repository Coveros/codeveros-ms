# Changelog
All notable changes to this project will be documented in this file.

## [0.5.0-dev] - 2021-08-16
### Changed
- Updated many dependencies
- Added create-service tests

## [0.4.0-dev] - 2021-01-04
### Changed
- **BREAKING**: createService.start() now returns a Promise that resolves to the initialized app server object, rather than synchronously returning the app server object
- **BREAKING**: If database parameters are defined, the app server creation will now wait until the database connection is made before starting the app server
- **BREAKING**: The initial database connection will continue to be attempted regardless of the type of Error thrown by mongoose.connect(). Before it was limited to a specific error.
- Changed build, test, and publish process to use Node.js 14.x.
- Updated many dependencies, including typescript, koa, and mongoose

## [0.3.0-dev] - 2020-02-11
### Added
- Route to retrieve API Docs (GET /api/docs). Returns the OpenAPI specification or a 500 error if not retrieved.
- createService options parameter to specify OpenAPI spec file location
  (**options.specPath**). Defaults to `swagger.yaml` and `swagger.json` in the project root directory.

## [0.2.0-dev] - 2020-01-14
### Changed
- **BREAKING**: Made database connection optional. If configuration not set via environment variables or passed in directly
  to createService, the database connection will be skipped. If relying on default values for database connection, it will
  no longer connect. Set `DB_DATABASE=myapp` and `DB_HOST=localhost` in .env file to restore existing default functionality.

### Removed
- Default database configuration for database name and host. Previously defaulted to **myapp** and **localhost**

## [0.1.0-dev]
Initial Functionality
