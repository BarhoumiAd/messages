const _ = require('lodash');
const { Pool } = require('pg');
const { config } = require('../util/config');

const NUMBER_OF_CONNECTIONS = 50;
const IDLE_TIMEOUT = 30000;
const CONNECTION_TIMEOUT = 300000;

class ConnectionPool {
  get(context) {
    const connection = new Pool({
      host: config.pgHost,
      port: config.pgPort,
      user: config.pgUser,
      password: config.pgPassword,
      database: config.pgDbName,

      max: NUMBER_OF_CONNECTIONS,
      idleTimeoutMillis: IDLE_TIMEOUT,
      connectionTimeoutMillis: CONNECTION_TIMEOUT,
    });
    context.pgClient = connection;
    return connection;
  }
}

const connPools = new ConnectionPool();

class SQL {
  constructor(context) {
    this.context = context;
  }

  async query(sql, positionalParams = undefined) {
    try {
      this.context.pgClient = this.context.pgClient
        ? this.context.pgClient
        : connPools.get(this.context);
      const result = await this.context.pgClient.query(sql, positionalParams);
      return result;
    } catch (error) {
      if (config.devMode() && !_.get(this.context, 'req.headers.suppress-sql-error-dump')) {
        let err = '';
        if (error.position) {
          let start = error.position - 10;
          if (start < 0) start = 0;
          err = `. Look for: "${sql.substr(start, 20)}"`;
        }
        this.context.logger().error(`${error.message}${err}\n\n${sql}`);
      }
      throw error;
    }
  }
}
module.exports = { SQL };
