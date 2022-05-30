const { Pool } = require('pg');
const { config } = require('../util/config');

const NUMBER_OF_CONNECTIONS = 50;
const IDLE_TIMEOUT = 30000;
const CONNECTION_TIMEOUT = 300000;

class ConnectionPool {
  get(context) {
    try {
      const pool = new Pool({
        host: config.pgHost,
        port: config.pgPort,
        user: config.pgUser,
        password: config.pgPassword,
        database: config.pgDbName,

        max: NUMBER_OF_CONNECTIONS,
        idleTimeoutMillis: IDLE_TIMEOUT,
        connectionTimeoutMillis: CONNECTION_TIMEOUT,
      });
      context.pgClient = pool;
      pool.on('error', function () {
        context.pgClient = null;
      });
      return pool;
    } catch (error) {
      context.logger().warn(`[ERROR Connection Pool], ${error.message}`);
      throw error;
    }
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
      this.context.logger().warn(`[ERROR Executing Query], ${error.message}`);
      this.context.logger().debug(error.stack);
      throw error;
    }
  }
}
module.exports = { SQL };
