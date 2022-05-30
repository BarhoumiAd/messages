const { v4: uuidv4 } = require('uuid');
const { cache } = require('../services/cache');
const { config } = require('../util/config');
const { createSystemContext } = require('../util/context');
const INSERT_QUERY = 'INSERT INTO qlik.message(id, text, palindrome) values ($1, $2, $3)';
const GET_QUERY = 'SELECT * FROM qlik.message {WHERE_CLAUSE}';
const DELETE_QUERY = 'DELETE FROM qlik.message {WHERE_CLAUSE}';
const UPDATE_QUERY = 'UPDATE qlik.message set text = $1, palindrome = $2 {WHERE_CLAUSE}';
const SYNCUP_PERIOD = config.SYNCUP_PERIOD;
class DatabaseMgr {
  synchronize() {
    setTimeout(async function () {
      await synchronizePgCache(createSystemContext());
    }, SYNCUP_PERIOD);
  }

  async save(context, message) {
    const id = uuidv4();
    const { text } = message;
    const palindrome = this._isPalindrome(text);

    if (await this.pgHealth(context)) {
      await context.sql().query(INSERT_QUERY, [id, text, palindrome]);
    } else {
      context.logger().warn(`Postgres is down. Writing to the cache`);
      await cache.put(context, id, { id, text, palindrome });
    }
    return { id, text, palindrome };
  }

  _isPalindrome(text) {
    let start = 0;
    let end = text.length - 1;
    while (start < end) {
      if (text[start] !== text[end]) return false;
      start += 1;
      end -= 1;
    }
    return true;
  }

  async get(context) {
    const positionalParams = [];
    let query = '';
    if (await this.pgHealth(context)) {
      if (context.req.params.id) {
        query = GET_QUERY.split('{WHERE_CLAUSE}').join(`WHERE id = $1`);
        positionalParams.push(context.req.params.id);
      } else query = GET_QUERY.split('{WHERE_CLAUSE}').join('');
      const result = await context.sql().query(query, positionalParams);
      return result.rows;
    } else {
      return this.readFromCache(context);
    }
  }

  async update(context, id, message) {
    const { text } = message;
    const palindrome = this._isPalindrome(text);
    if (await this.pgHealth(context)) {
      const query = UPDATE_QUERY.split('{WHERE_CLAUSE}').join(`WHERE id = $3`);
      const positionalParams = [text, palindrome, id];
      await context.sql().query(query, positionalParams);
    } else {
      context.logger().warn(`Postgres is down. Writing to the cache`);
      await cache.put(context, id, { id, text, palindrome });
    }
    return { id, text, palindrome };
  }

  async delete(context, id) {
    if (await this.pgHealth(context)) {
      const positionalParams = [];
      const query = DELETE_QUERY.split('{WHERE_CLAUSE}').join(`WHERE id = $1`);
      positionalParams.push(id);
      await context.sql().query(query, positionalParams);
    } else {
      await cache.expireKeys([id]);
    }
  }

  async pgHealth(context) {
    let healthy = true;
    try {
      const health = await context.sql().query(`SELECT 1;`);
      healthy = health.rowCount === 1;
    } catch (error) {
      healthy = false;
      context.logger().error(`Postgres is down: ${error.message}`);
    } finally {
      // eslint-disable-next-line no-unsafe-finally
      return healthy;
    }
  }

  async readFromCache(context) {
    context.logger().warn(`Postgres is down, reading from the cache.`);
    const id = context.req.params.id;
    let result;
    if (id) {
      result = await cache.get(id);
    } else {
      result = await cache.getAll('*');
    }
    return result;
  }

  async bulkPersist(context, data) {
    const keysToExpires = [];
    if (await this.pgHealth(context)) {
      for (const record of data) {
        await context.sql().query(INSERT_QUERY, [record.id, record.text, record.palindrome]);
        keysToExpires.push(record.id);
      }
      await cache.expireKeys(keysToExpires);
    }
  }
}

async function synchronizePgCache(context) {
  try {
    // get data from cache and persist in postgres
    const data = await cache.getAll('*');

    if (data && data.length > 0 && (await global.databaseMgr.pgHealth())) {
      context.logger().debug(`Updating cache to postgres`);
      await global.databaseMgr.bulkPersist(context, data);
    }
    setTimeout(async function () {
      await synchronizePgCache(context);
    }, SYNCUP_PERIOD);
  } catch (error) {
    context.logger().warn(`[ERROR on Synchronize], ${error.message}`);
    context.logger().debug(error.stack);
  }
}

if (!global.databaseMgr) {
  global.databaseMgr = new DatabaseMgr();
}

module.exports = { databaseMgr: global.databaseMgr };
