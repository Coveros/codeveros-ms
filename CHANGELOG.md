# Changelog
All notable changes to this project will be documented in this file.

## [0.2.0-dev] - 2020-01-14
### Changed
- **BREAKING**: Made database connection optional. If configuration not set via environment variables or passed in directly
  to createService, the database connection will be skipped. If relying on default values for database connection, it will
  no longer connect. Set `DB_DATABASE=myapp` and `DB_HOST=localhost` in .env file to restore existing default functionality.

### Removed
- Default database configuration for database name and host. Previously defaulted to **myapp** and **localhost**

## [0.1.0-dev]
Initial Functionality
